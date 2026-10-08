const CardID = () => {
  const generateRandomString = () => {
    const length = 30;
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomString = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomString += characters.charAt(randomIndex);
    }
    localStorage.setItem("randomString", randomString);
    return randomString;
  };

  let existingRandomString = localStorage.getItem("randomString");
  if (!existingRandomString) {
    existingRandomString = generateRandomString();
  }
  return existingRandomString;
};

export default CardID;
