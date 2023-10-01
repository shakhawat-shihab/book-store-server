const fs = require("fs");
const path = require("path");

async function readLogFile(filePath) {
  try {
    const data = await fs.promises.readFile(filePath, "utf-8");
    // console.log("my data ", data);
    jsonData = JSON.parse(data);
    return jsonData;
  } catch (error) {
    throw new Error(`Error reading file: ${error.message}`);
  }
}

async function writeFile(filePath, data) {
  try {
    await fs.promises.writeFile(filePath, JSON.stringify(data), "utf-8");
  } catch (error) {
    throw new Error(`Error writing file: ${error.message}`);
  }
}

function getTime() {
  const date = new Date();
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dayOfWeek = daysOfWeek[date.getDay()];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const time =
    date.getHours() +
    ":" +
    ("0" + date.getMinutes()).slice(-2) +
    ":" +
    ("0" + date.getSeconds()).slice(-2);
  const timeZone = date.toString().match(/\((.*?)\)/)[1];
  const formattedDate = `${dayOfWeek} ${month} ${day} ${year} ${time} GMT${
    date.getTimezoneOffset() / -60 > 0 ? "+" : "-"
  }${("0" + date.getTimezoneOffset() / -60).slice(-2)}00 (${timeZone})`;
  //   console.log(formattedDate);
  return formattedDate;
}

async function insertInLog(
  originalUrl,
  query,
  params,
  body,
  isError,
  message,
  errorPassed
) {
  try {
    let time = getTime();
    // console.log(req.query);
    // console.log(req.body);

    let filePath = path.join(__dirname, "log.txt");

    let fileData = fs.readFileSync(filePath, "utf8");
    // let fileData = await readLogFile(filePath);
    // console.log("fileData ", fileData);

    if (isError) {
      fileData += `
${time}
Error
    Message: ${message}
    ${JSON.stringify(errorPassed)}`;
    } else {
      fileData += `
${time}
Endpoint: ${originalUrl}
Request
    Query:${JSON.stringify(query)}
    Params:${JSON.stringify(params)}
    Body:${JSON.stringify(body)}
    `;
    }

    fs.writeFileSync(filePath, fileData + "\n");
    // const result = await writeFile(filePath, fileData);
    return { success: true };
  } catch (error) {
    console.error(error.message);
    return { success: false };
  }
}

module.exports = { insertInLog, getTime };
