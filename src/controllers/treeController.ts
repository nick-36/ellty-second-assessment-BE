import { Request, Response } from "express";
import { PrismaClient, User } from "@prisma/client";
import formOperations from "../lib/nestedOperation";

const prisma = new PrismaClient();

interface CreateTreeBody {
  startingNumber: number;
}

export interface AuthRequest extends Request {
  user?: User;
}

const calculateResult = (
  leftNumber: number,
  rightNumber: number,
  type: string
): number => {
  switch (type) {
    case "ADD":
      return leftNumber + rightNumber;
    case "SUBTRACT":
      return leftNumber - rightNumber;
    case "MULTIPLY":
      return leftNumber * rightNumber;
    case "DIVIDE":
      if (rightNumber === 0) throw new Error("Division by zero");
      return leftNumber / rightNumber;
    default:
      throw new Error("Invalid operation type");
  }
};

export const createTree = async (
  req: AuthRequest,
  res: Response
): Promise<void | Response> => {
  try {
    const { startingNumber }: CreateTreeBody = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const tree = await prisma.tree.create({
      data: {
        startingNumber,
        userId,
      },
    });

    return res.status(201).json(tree);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const getAllTrees = async (
  _req: Request,
  res: Response
): Promise<void | Response> => {
  try {
    const trees = await prisma.tree.findMany({
      include: {
        operations: {
          include: {
            children: true,
          },
        },
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    return res.status(200).json(trees);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getTree = async (
  req: Request,
  res: Response
): Promise<void | Response> => {
  try {
    const { id } = req.params;

    const tree = await prisma.tree.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: { username: true },
        },
        operations: {
          include: {
            user: {
              select: { username: true },
            },
            children: {
              include: {
                user: {
                  select: { username: true },
                },
              },
            },
          },
        },
      },
    });

    if (!tree) {
      return res.status(404).json({ message: "Tree not found" });
    }

    const nestedOperations = formOperations(tree.operations);

    return res.status(200).json({
      ...tree,
      operations: nestedOperations,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const addOperation = async (
  req: AuthRequest,
  res: Response
): Promise<void | Response> => {
  try {
    const { id: treeId } = req.params;
    const { type, rightNumber, parentOperationId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let leftNumber: number;

    if (parentOperationId) {
      // Handle operations based on an existing parent operation
      const parentOperation = await prisma.operation.findUnique({
        where: { id: parseInt(parentOperationId.toString()) },
      });

      if (!parentOperation) {
        return res.status(404).json({ message: "Parent operation not found" });
      }

      leftNumber = parentOperation.result;
    } else {
      // Handle operations starting from the tree's starting number
      const tree = await prisma.tree.findUnique({
        where: { id: parseInt(treeId) },
      });

      if (!tree) {
        return res.status(404).json({ message: "Tree not found" });
      }

      leftNumber = tree.startingNumber;
    }

    const result = calculateResult(leftNumber, rightNumber, type);

    // Create the new operation
    const operation = await prisma.operation.create({
      data: {
        type,
        rightNumber,
        result,
        treeId: parseInt(treeId),
        userId,
        parentId: parentOperationId
          ? parseInt(parentOperationId.toString())
          : null,
      },
    });

    return res.status(201).json({
      operation,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};
