export const TreeMap = {
  parent: null,
  isConqueredByRed: 0,
  isConqueredByBlue: 0,
  onTree: null,
  children: [null, null, null, null, null, null],
  fungsiTest: (param) => {
    console.log("Isi : " + param);
  },
};

// Factory function to create new TreeMap nodes
export function createTreeNode(index) {
  return {
    parent: null,
    isConqueredByRed: 0,
    isConqueredByBlue: 0,
    onTree: index,
    children: [null, null, null, null, null, null],
    fungsiTest: (param) => {
      console.log(`Node ${index} - Isi: ${param}`);
    },
  };
}
