const KoaRouter = require("koa-router");
const Koa = require("koa");
const path = require("path");
const fs = require("fs");

const app = new Koa();
const router = new KoaRouter();

router.get("/api/rangeFile", async (ctx) => {
  console.log("进来了");
  const { filename, count } = ctx.query;
  //获取资源文件的绝对路径
  let filePath = path.resolve(__dirname + "/files/" + filename);
  console.log(filePath);
  let resHead = readFile(ctx.headers.range, filePath);
  ctx.status = resHead.code;
  ctx.set(resHead.head);
  let stream = fs.createReadStream(
    filePath,
    resHead.code == 200 ? {} : { start: resHead.start, end: resHead.end }
  );
  stream.pipe(ctx.res);
  // //也可使用这种方式。
  // stream.on('data', e => ctx.res.write(e));
  // // 接收完毕
  // stream.on('end', e => ctx.res.end());
  ctx.respond = false;
  return;
});

/**
 * [读文件]
 * @param  {String} range        [数据起始位]
 * @param  {String} filePath     [文件路径]
 * @param  {Number} chunkSize    [每次请求碎片大小 （900kb 左右）]
 */
function readFile(range, filePath, chunkSize = 499999 * 2) {
  //mime类型
  const mime = {
    css: "text/css",
    gif: "image/gif",
    html: "text/html",
    ico: "image/x-icon",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    js: "text/javascript",
    json: "application/json",
    pdf: "application/pdf",
    png: "image/png",
    svg: "image/svg+xml",
    swf: "application/x-shockwave-flash",
    tiff: "image/tiff",
    txt: "text/plain",
    mp3: "audio/mp3",
    wav: "audio/x-wav",
    wma: "audio/x-ms-wma",
    wmv: "video/x-ms-wmv",
    xml: "text/xml",
    mp4: "video/mp4",
  };
  // 获取后缀名
  let ext = path.extname(filePath);
  ext = ext ? ext.slice(1) : "unknown";
  //未知的类型一律用"text/plain"类型
  let contentType = mime[ext.toLowerCase()];

  //建立流对象，读文件
  let stat = fs.statSync(filePath);
  let fileSize = stat.size;
  let head = {
    code: 200,
    head: {
      "Content-Length": fileSize,
      "content-type": contentType,
    },
  };
  if (range) {
    // 大文件分片
    let parts = range.replace(/bytes=/, "").split("-");
    let start = parseInt(parts[0], 10);
    let end = parts[1] ? parseInt(parts[1], 10) : start + chunkSize;
    end = end > fileSize - 1 ? fileSize - 1 : end;
    chunkSize = end - start + 1;
    head = {
      code: 206,
      filePath,
      start,
      end,
      head: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "content-type": contentType,
        "Content-Length": chunkSize,
        "Accept-Ranges": "bytes",
      },
    };
  }
  return head;
}

app.use(router.routes());
app.listen(8888, () => {
  console.log("服务启动成功");
});
