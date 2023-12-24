const lower_case = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
];
const upper_case = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];
const symbol = [
  "1",
  "@",
  "#",
  "$",
  "2",
  "3",
  "&",
  "4",
  "-",
  "_",
  "5",
  "6",
  "9",
  "+",
  "0",
  "7",
  "8",
];

module.exports.GenerateToken = (numb) => {
  var code = "";
  for (let i = 0; i < numb; i++) {
    if (i === 0 || i === 4 || i === 8 || i === 7)
      code = code + lower_case[Math.floor(Math.random() * 26)];
    else if (i === 1 || i === 3 || i === 6 || i === 11)
      code = code + upper_case[Math.floor(Math.random() * 26)];
    else code = code + symbol[Math.floor(Math.random() * 17)];
  }
  return code;
};
