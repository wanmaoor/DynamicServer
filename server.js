var http = require("http");
var fs = require("fs");
var url = require("url");
var port = process.argv[2];

if (!port) {
  console.log("请指定端口号好不啦？\nnode server.js 8888 这样不会吗？");
  process.exit(1);
}

var server = http.createServer(function(request, response) {
  var parsedUrl = url.parse(request.url, true);
  var pathWithQuery = request.url;
  var queryString = "";
  if (pathWithQuery.indexOf("?") >= 0) {
    queryString = pathWithQuery.substring(pathWithQuery.indexOf("?"));
  }
  var path = parsedUrl.pathname;
  console.log(path);
  var query = parsedUrl.query;
  var method = request.method;

  /******** 从这里开始看，上面不要看 ************/

  console.log("有个傻子发请求过来啦！路径（带查询参数）为：" + pathWithQuery);
  if (path === "/register" && method === "POST") {
    let bufferArray = [];
    const userArray = JSON.parse(fs.readFileSync("./db/user.json").toString());
    request.on("data", chunk => {
      bufferArray.push(chunk);
    });
    request.on("end", () => {
      const { username, password } = JSON.parse(
        Buffer.concat(bufferArray).toString()
      );
      const lastUser = userArray[userArray.length - 1];
      const newUser = {
        id: lastUser ? lastUser.id + 1 : 1,
        username,
        password
      };
      userArray.push(newUser);
      fs.writeFileSync("./db/user.json", JSON.stringify(userArray));
    });
    response.setHeader("Content-Type", "text/html");
    response.end();
  } else if (path === "/signIn" && method === "POST") {
    response.setHeader("Content-Type", "text/html");
    let bufferArray = [];
    const userArray = JSON.parse(fs.readFileSync("./db/user.json").toString());
    let sessionArray = JSON.parse(
      fs.readFileSync("./db/session.json").toString()
    );
    request.on("data", chunk => {
      bufferArray.push(chunk);
    });
    const random = Math.random();

    request.on("end", () => {
      const { username, password } = JSON.parse(
        Buffer.concat(bufferArray).toString()
      );
      const user = userArray.find(user => {
        return user.username === username && user.password === password;
      });
      if (user === undefined) {
        response.statusCode = 400;
        response.end("登陆失败");
      } else {
        response.statusCode = 200;
        response.setHeader("Set-Cookie", `session_id=${random}`);
        const sessionItem = { id: user.id, random };
        sessionArray.push(sessionItem);
        const stringifySessionArray = JSON.stringify(sessionArray);
        fs.writeFileSync("./db/session.json", stringifySessionArray);
        response.end();
      }
    });
  } else if (path === "/home.html") {
    response.setHeader("Content-Type", "text/html");
    const page = fs.readFileSync("./public/home.html").toString();
    const cookie = request.headers["cookie"] || "noCookie";
    if (cookie === "noCookie") {
      const template = page.replace("{{loginStatus}}", `未登录`).replace("{{userName}}", "游客");
      response.write(template);
      response.end();
    } else {
      let cookieArray = cookie.split("");
      const equalMarkIndex = cookie.split("").findIndex(item => item === "=");
      cookieArray = cookieArray.splice(equalMarkIndex + 1);
      const session_id = Number(cookieArray.join(""));
      const userArray = JSON.parse(
        fs.readFileSync("./db/user.json").toString()
      );
      const sessionArray = JSON.parse(
        fs.readFileSync("./db/session.json").toString()
      );
      const sessionItem = sessionArray.filter(sessionItem => {
        return session_id === sessionItem.random;
      })[0];
      const userName = userArray.filter(user => {
        if (user.id === sessionItem.id) {
          return user.username;
        }
      })[0].username;
      if (sessionItem) {
        const template = page
          .replace("{{loginStatus}}", "已登录了")
          .replace("{{userName}}", userName);
        response.write(template);
        response.end();
      }
    }
  } else {
    let result;
    const fileType = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "text/javascript",
      ".png": "image/png"
    };
    path = path === "/" ? "/index.html" : path;
    const index = path.lastIndexOf(".");
    const suffix = path.substring(index);
    response.statusCode = 200;
    response.setHeader(
      "Content-Type",
      `${fileType[suffix] || "text/plain"};charset=utf-8`
    );

    try {
      result = fs.readFileSync(`./public${path}`);
    } catch (error) {
      response.statusCode = 404;
      result = `请求失败, ${error}`;
    }
    response.write(result);
    response.end();
  }

  /******** 代码结束，下面不要看 ************/
});

server.listen(port);
console.log(
  "监听 " +
    port +
    " 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:" +
    port
);
