export interface Operation {
  id: number;
  type: string;
  rightNumber: number;
  result: number;
  treeId: number;
  userId: number;
  parentId: number | null;
  createdAt: Date;
}

export interface OperationWithChildren extends Operation {
  children: Array<OperationWithChildren>;
}

function formOperations(
  operations: Array<Operation>
): Array<OperationWithChildren> {
  const map = new Map<number, OperationWithChildren>();
  const roots: Array<OperationWithChildren> = [];

  for (const operation of operations) {
    map.set(operation.id, {
      ...operation,
      children: [],
    } as OperationWithChildren);
  }

  for (const operation of operations) {
    if (operation.parentId !== null) {
      const parent = map.get(operation.parentId);
      if (parent) {
        parent.children.push(map.get(operation.id)!);
      }
    } else {
      roots.push(map.get(operation.id)!);
    }
  }

  return roots;
}

export default formOperations;


