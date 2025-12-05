const characters = [
  // (LEADERS)
  {
    nama: "ROI",
    ability: "leader",
    fullart: "/Full Art/LEADERS-Roi.PNG",
    white: "/Assets BGA/Pions personnages/Blanc/Leaders_BGA_white_LeaderRoi.png",
    black: "/Assets BGA/Pions personnages/Noir/Leaders_BGA_black_LeaderRoi.png"
  },
  {
    nama: "REINE",
    ability: "leader",
    fullart: "/Full Art/LEADERS-Reine.PNG",
    white: "/Assets BGA/Pions personnages/Blanc/Leaders_BGA_white_LeaderReine.png",
    black: "/Assets BGA/Pions personnages/Noir/Leaders_BGA_black_LeaderReine.png"
  },

  // (Active ability)
  {
    nama: "ACROBAT",
    ability: "Jumps in a straight line over an adjacent character. May jump twice consecutively.",
    fullart: "/Full Art/LEADERS-Acrobate.PNG",
    white: "/Assets BGA/Pions personnages/Blanc/Leaders_BGA_white_Acrobate.png",
    black: "/Assets BGA/Pions personnages/Noir/Leaders_BGA_black_Acrobate.png"
  },
  {
    nama: "CAVALIER",
    ability: "Moves two spaces in a straight line.",
    fullart: "Full Art/LEADERS-Cavalier.PNG",
    white: "/Assets BGA/Pions personnages/Blanc/Leaders_BGA_black_Cavalier.png",
    black: "/Assets BGA/Pions personnages/Noir/Leaders_BGA_black_Cavalier.png"
  },
  {
    nama: "COGNEUR",
    ability: "Moves to an adjacent enemy’s space, pushing them to one of the opposite three spaces of your choice.",
    fullart: "Full Art/LEADERS-COGNEUR.PNG",
    white: "/Assets BGA/Pions personnages/Blanc/Leaders_BGA_white_Cogneur.png",
    black: "/Assets BGA/Pions personnages/Noir/Leaders_BGA_black_Cogneur.png"
  },
  {
    nama: "ROYAL GUARD",
    ability: "Moves from any space to a space adjacent to your Leader. May then move one additional space.",
    fullart: "Full Art/LEADERS-GardeRoyal.PNG",
    white: "/Assets BGA/Pions personnages/Blanc/Leaders_BGA_white_GardeRoyal.png",
    black: "/Assets BGA/Pions personnages/Noir/Leaders_BGA_black_GardeRoyal.png"
  },
  {
    nama: "ILLUSIONIST",
    ability: "Switches places with a non-adjacent, visible character in a straight line.",
    fullart: "Full Art/LEADERS-Shifter.PNG",
    white: "/Assets BGA/Pions personnages/Blanc/Leaders_BGA_white_Illusionniste.png",
    black: "/Assets BGA/Pions personnages/Noir/Leaders_BGA_black_Illusionniste.png"
  },
  {
    nama: "CLAW LAUNCHER",
    ability: "Moves in a straight line all the way to a visible character, OR drags them until they are adjacent.",
    fullart: "Full Art/LEADERS-LanceGrappin.PNG",
    white: "/Assets BGA/Pions personnages/Blanc/Leaders_BGA_white_LanceGrappin.png",
    black: "/Assets BGA/Pions personnages/Noir/Leaders_BGA_black_LanceGrappin.png"
  },
  {
    nama: "MANIPULATOR",
    ability: "Moves a non-adjacent enemy, visible in a straight line, by one space",
    fullart: "Full Art/LEADERS-Manipulatrice.PNG",
    white: "/Assets BGA/Pions personnages/Blanc/Leaders_BGA_white_Manipulatrice.png",
    black: "/Assets BGA/Pions personnages/Noir/Leaders_BGA_black_Manipulatrice.png"
  },
  {
    nama: "WANDERER",
    ability: "Moves to any space non-adjacent to an enemy.",
    fullart: "Full Art/LEADERS-Furie.PNG",
    white: "/Assets BGA/Pions personnages/Blanc/Leaders_BGA_white_Rodeuse.png",
    black: "/Assets BGA/Pions personnages/Noir/Leaders_BGA_black_Rodeuse.png"
  },
  {
    nama: "BREWMASTER",
    ability: "Moves an adjacent ally one space.",
    fullart: "Full Art/LEADERS-Cuisinier.PNG",
    white: "/Assets BGA/Pions personnages/Blanc/Leaders_BGA_white_Tavernier.png",
    black: "/Assets BGA/Pions personnages/Noir/Leaders_BGA_black_Tavernier.png"
  },

  // (Pasif ability)
  {
    nama: "ARCHER",
    ability: "Can be two spaces in a straight line from the opponent’s Leader and help capture them. The Leader does not need to be visible. However, does not help capture the opponent’s Leader when adjacent.",
    fullart: "Full Art/LEADERS-Archere-LQ.PNG",
    white: "/Assets BGA/Pions personnages/Blanc/Leaders_BGA_white_Archere.png",
    black: "/Assets BGA/Pions personnages/Noir/Leaders_BGA_black_Archere.png"
  },
  {
    nama: "ASSASSIN",
    ability: "Captures the opponent’s Leader when adjacent. (Without a second ally.)",
    fullart: "Full Art/LEADERS-Assassin.PNG",
    white: "/Assets BGA/Pions personnages/Blanc/Leaders_BGA_white_Assassin.png",
    black: "/Assets BGA/Pions personnages/Noir/Leaders_BGA_black_Assassin.png"
  },
  {
    nama: "JAILER",
    ability: "Adjacent enemies with an active ability their ability. cannot use their ability.",
    fullart: "Full Art/LEADERS-Disrupteur.PNG",
    white: "/Assets BGA/Pions personnages/Blanc/Leaders_BGA_white_Geolier.png",
    black: "/Assets BGA/Pions personnages/Noir/Leaders_BGA_black_Geolier.png"
  },
  {
    nama: "PROTECTOR",
    ability: "Enemy abilites may not move the Protector or any adjacent allies.",
    fullart: "Full Art/LEADERS-Ancien.PNG",
    white: "/Assets BGA/Pions personnages/Blanc/Leaders_BGA_white_Protecteur.png",
    black: "/Assets BGA/Pions personnages/Noir/Leaders_BGA_black_Protecteur.png"
  },
  {
    nama: "VIZIER",
    ability: "Your Leader may move one additional space during their action.",
    fullart: "Full Art/LEADERS-Oracle.PNG",
    white: "/Assets BGA/Pions personnages/Blanc/Leaders_BGA_white_Vizir.png",
    black: "/Assets BGA/Pions personnages/Noir/Leaders_BGA_black_Vizir.png"
  },

  // (Special ability)
  {
    nama: "HERMIT",
    ability: "When you recruit them, take both the Hermit and the Cub and place each on an empty recruitment space (not necessarily adjacent). During the action phase, you can move either the Hermit or the Cub, or one after another. The cub cannot help capture the opponent’s Leader.",
    fullart: "Full Art/LEADERS-MaitreDesBetes.PNG",
    white: "/Assets BGA/Pions personnages/Blanc/Leaders_BGA_white_VieilOurs.png",
    black: "/Assets BGA/Pions personnages/Noir/Leaders_BGA_black_VieilOurs.png"
  },
  {
    nama: "CUB",
    ability: "-",
    fullart: "Full Art/LEADERS-Ours.PNG",
    white: "/Assets BGA/Pions personnages/Blanc/Leaders_BGA_white_Ourson.png",
    black: "/Assets BGA/Pions personnages/Noir/Leaders_BGA_black_Ourson.png"
  },
  {
    nama: "NEMESIS",
    ability: "Cannot take an action during their action phase. During your turn or your opponent’s turn, after any action moving the opponent’s Leader (one or more spaces), the Nemesis MUST move two spaces. Nemesis cannot move away and back to their current space.",
    fullart: "Full Art/LEADERS-Nemesis_LQ.PNG",
    white: "/Assets BGA/Pions personnages/Blanc/Leaders_BGA_white_Nemesis.png",
    black: "/Assets BGA/Pions personnages/Noir/Leaders_BGA_black_Nemesis.png"
  }
];
