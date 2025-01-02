"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addOperation = exports.getTree = exports.getAllTrees = exports.createTree = void 0;
const client_1 = require("@prisma/client");
const nestedOperation_1 = __importDefault(require("../lib/nestedOperation"));
const prisma = new client_1.PrismaClient();
const calculateResult = (leftNumber, rightNumber, type) => {
    switch (type) {
        case "ADD":
            return leftNumber + rightNumber;
        case "SUBTRACT":
            return leftNumber - rightNumber;
        case "MULTIPLY":
            return leftNumber * rightNumber;
        case "DIVIDE":
            if (rightNumber === 0)
                throw new Error("Division by zero");
            return leftNumber / rightNumber;
        default:
            throw new Error("Invalid operation type");
    }
};
const createTree = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { startingNumber } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const tree = yield prisma.tree.create({
            data: {
                startingNumber,
                userId,
            },
        });
        return res.status(201).json(tree);
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
});
exports.createTree = createTree;
const getAllTrees = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const trees = yield prisma.tree.findMany({
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
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.getAllTrees = getAllTrees;
const getTree = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const tree = yield prisma.tree.findUnique({
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
        const nestedOperations = (0, nestedOperation_1.default)(tree.operations);
        return res.status(200).json(Object.assign(Object.assign({}, tree), { operations: nestedOperations }));
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.getTree = getTree;
const addOperation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id: treeId } = req.params;
        const { type, rightNumber, parentOperationId } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        let leftNumber;
        if (parentOperationId) {
            // Handle operations based on an existing parent operation
            const parentOperation = yield prisma.operation.findUnique({
                where: { id: parseInt(parentOperationId.toString()) },
            });
            if (!parentOperation) {
                return res.status(404).json({ message: "Parent operation not found" });
            }
            leftNumber = parentOperation.result;
        }
        else {
            // Handle operations starting from the tree's starting number
            const tree = yield prisma.tree.findUnique({
                where: { id: parseInt(treeId) },
            });
            if (!tree) {
                return res.status(404).json({ message: "Tree not found" });
            }
            leftNumber = tree.startingNumber;
        }
        const result = calculateResult(leftNumber, rightNumber, type);
        // Create the new operation
        const operation = yield prisma.operation.create({
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
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
});
exports.addOperation = addOperation;
