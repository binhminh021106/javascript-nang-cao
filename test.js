const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mysql = require("mysql");
const NodeCache = require("node-cache");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const port = 8080;

// --- 1. CẤU HÌNH CƠ BẢN ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// Socket.io
const io = new Server(server, { cors: { origin: "*" } });
io.on("connection", (socket) => console.log("✅ Client connected:", socket.id));

// Cache & DB
const myCache = new NodeCache({ stdTTL: 60 });
const pool = mysql.createPool({
  host: "localhost", user: "root", password: "", database: "javascript"
});

const db = (sql, params) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// --- 2. CẤU HÌNH UPLOAD ẢNH ---
const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
  }),
  fileFilter: (req, file, cb) => {
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error("Chỉ ảnh!"), false);
  }
});

// --- 3. CÁC HÀM XỬ LÝ PHỤ ---
const clearCache = () => {
  const keys = myCache.keys().filter(k => k.startsWith("list-"));
  if (keys.length) myCache.del(keys);
};

const deleteFile = (filename) => {
  if (!filename) return;
  const filePath = path.join(uploadDir, filename.trim());
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

const formatImageURL = (imgStr) => {
  if (!imgStr) return "";
  const processOne = (s) => s.startsWith("http") ? s : `http://localhost:${port}/uploads/${s}`;
  return imgStr.includes(",") ? imgStr.split(",").map(processOne).join(",") : processOne(imgStr);
};

// GET: Lấy danh sách
app.get("/api/home", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const cacheKey = `list-${page}-${limit}`;

    const cached = myCache.get(cacheKey);
    if (cached) return res.json(cached);

    const offset = (page - 1) * limit;
    const countRes = await db("SELECT COUNT(*) AS total FROM sanpham");
    const dataRes = await db("SELECT * FROM sanpham LIMIT ? OFFSET ?", [limit, offset]);

    const data = dataRes.map(item => ({
      ...item,
      image: formatImageURL(item.image)
    }));

    const result = { page, limit, total: countRes[0].total, data };
    myCache.set(cacheKey, result);
    res.json(result);

  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// GET: Chi tiết 1 sản phẩm
app.get("/api/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const cached = myCache.get(`product-${id}`);
    if (cached) return res.json(cached);

    const rows = await db("SELECT * FROM sanpham WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Không tìm thấy" });

    myCache.set(`product-${id}`, rows[0]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// POST: Thêm mới
app.post("/api/products", upload.array("images", 5), async (req, res) => {
  try {
    const { name, price, description, status } = req.body;
    const images = req.files.map(f => f.filename).join(",");

    await db("INSERT INTO sanpham (name, price, description, image, status) VALUES (?, ?, ?, ?, ?)", 
      [name, price, description || "", images, status || 1]);

    clearCache();
    io.emit("REFRESH_DATA");
    res.status(201).json({ message: "Thêm thành công" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi thêm dữ liệu" });
  }
});

// PUT: Cập nhật
app.put("/api/products/:id", upload.array("images", 5), async (req, res) => {
  try {
    const id = req.params.id;
    const { name, price, description, status, keepOldImages } = req.body;

    const oldRows = await db("SELECT image FROM sanpham WHERE id = ?", [id]);
    if (oldRows.length === 0) return res.status(404).json({ error: "Không tìm thấy" });

    const oldImgs = oldRows[0].image ? oldRows[0].image.split(",") : [];
    const newImgs = req.files.map(f => f.filename);

    // 2. Logic xử lý ảnh
    let finalImgs = [];
    if (keepOldImages === "true") {
      finalImgs = [...oldImgs, ...newImgs];
    } else {
      if (newImgs.length > 0) {
        finalImgs = newImgs;
        oldImgs.forEach(deleteFile);
      } else {
        finalImgs = oldImgs; 
      }
    }

    // 3. Update DB
    await db("UPDATE sanpham SET name=?, price=?, description=?, image=?, status=? WHERE id=?", 
      [name, price, description, finalImgs.join(","), status, id]);

    clearCache();
    myCache.del(`product-${id}`);
    io.emit("REFRESH_DATA");
    res.json({ message: "Cập nhật thành công" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi cập nhật" });
  }
});

// DELETE: Xóa
app.delete("/api/products/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const rows = await db("SELECT image FROM sanpham WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Không tìm thấy" });

    await db("DELETE FROM sanpham WHERE id = ?", [id]);

    if (rows[0].image) {
      rows[0].image.split(",").forEach(deleteFile);
    }

    clearCache();
    myCache.del(`product-${id}`);
    io.emit("REFRESH_DATA");
    res.json({ message: "Xóa thành công" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi xóa dữ liệu" });
  }
});

// Chạy server
server.listen(port, () => console.log(`🚀 Server: http://localhost:${port}`));