// Factory function to create new TreeMap nodes
export function createTreeNode(index) {
  return {
    pasukanDiPetakIni: null,
    pasukanGambar: null,
    pasukanID: null,

    isConqueredByWhite: 0,
    isConqueredByBlack: 0,
    
    onTree: index, // ini pasukan yang nempati sekarang
    children: [null, null, null, null, null, null], // ntik link kan ke adj
    
    fungsiTest: (param) => {
      console.log(`Node ${index} - Isi: ${param}`);
    },
  };
}
