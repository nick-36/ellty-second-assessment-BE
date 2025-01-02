"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function formOperations(operations) {
    const map = new Map();
    const roots = [];
    for (const operation of operations) {
        map.set(operation.id, Object.assign(Object.assign({}, operation), { children: [] }));
    }
    for (const operation of operations) {
        if (operation.parentId !== null) {
            const parent = map.get(operation.parentId);
            if (parent) {
                parent.children.push(map.get(operation.id));
            }
        }
        else {
            roots.push(map.get(operation.id));
        }
    }
    return roots;
}
exports.default = formOperations;
