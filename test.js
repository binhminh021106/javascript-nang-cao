const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mysql = require("mysql");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const port = 8080;
const uploadDir = path.join(__dirname, "public", "uploads");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadDir));

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Socket.IO
const io = new Server(server, { cors: { origin: "*" } });

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "shop_db",
});

const db = (sql, params) =>
  new Promise((resolve, reject) => {
    pool.query(sql, params, (err, res) => (err ? reject(err) : resolve(res)));
  });

const toSlug = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[áàảãạăắằẳẵặâấầẩẫậ]/g, "a")
    .replace(/[éèẻẽẹêếềểễệ]/g, "e")
    .replace(/[iíìỉĩị]/g, "i")
    .replace(/[óòỏõọôốồổỗộơớờởỡợ]/g, "o")
    .replace(/[úùủũụưứừửữự]/g, "u")
    .replace(/[ýỳỷỹỵ]/g, "y")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const formatImg = (str) =>
  str
    ? str.includes("http")
      ? str
      : `http://localhost:${port}/uploads/${str}`
    : "";

const deleteImg = (name) => {
  const file = path.join(uploadDir, name.trim());
  if (fs.existsSync(file)) fs.unlinkSync(file);
};

// --- CẤU HÌNH UPLOAD ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const slug = toSlug(req.body.name || "san-pham");
    cb(null, `${slug}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith("image/")),
});

// --- API SẢN PHẨM ---

// Lấy danh sách
app.get("/api/home", async (req, res) => {
  try {
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 10;
    const offset = (page - 1) * limit;

    const [count] = await db("SELECT COUNT(*) as total FROM sanpham");
    const sql = `SELECT s.*, c.name as category_name FROM sanpham s 
                 LEFT JOIN categories c ON s.category_id = c.id 
                 ORDER BY s.id DESC LIMIT ? OFFSET ?`;
    const rows = await db(sql, [limit, offset]);

    const data = rows.map((p) => ({
      ...p,
      image: p.image ? p.image.split(",").map(formatImg).join(",") : "",
    }));
    res.json({ page, limit, total: count.total, data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Chi tiết sản phẩm
app.get("/api/products/:id", async (req, res) => {
  try {
    const rows = await db("SELECT * FROM sanpham WHERE id = ?", [
      req.params.id,
    ]);
    rows.length
      ? res.json(rows[0])
      : res.status(404).json({ error: "Not found" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Thêm sản phẩm
app.post("/api/products", upload.array("images", 5), async (req, res) => {
  try {
    const { name, price, description, status, category_id } = req.body;
    const images = req.files.map((f) => f.filename).join(","); // Lấy tên file từ multer

    await db(
      "INSERT INTO sanpham (name, price, description, image, status, category_id) VALUES (?, ?, ?, ?, ?, ?)",
      [name, price, description || "", images, status || 1, category_id || null]
    );

    io.emit("REFRESH_DATA");
    res.status(201).json({ message: "Thêm thành công" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Sửa sản phẩm
app.put("/api/products/:id", upload.array("images", 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, status, category_id, keepOldImages } =
      req.body;

    const [oldData] = await db("SELECT image FROM sanpham WHERE id=?", [id]);
    if (!oldData) return res.status(404).json({ error: "Not found" });

    let oldImgs = oldData.image ? oldData.image.split(",") : [];
    const newImgs = req.files.map((f) => f.filename);

    let finalImgs =
      keepOldImages === "true"
        ? [...oldImgs, ...newImgs]
        : newImgs.length
        ? (oldImgs.forEach(deleteImg), newImgs)
        : oldImgs;

    await db(
      "UPDATE sanpham SET name=?, price=?, description=?, image=?, status=?, category_id=? WHERE id=?",
      [
        name,
        price,
        description,
        finalImgs.join(","),
        status,
        category_id || null,
        id,
      ]
    );

    io.emit("REFRESH_DATA");
    res.json({ message: "Cập nhật thành công" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Xóa sản phẩm
app.delete("/api/products/:id", async (req, res) => {
  try {
    const [row] = await db("SELECT image FROM sanpham WHERE id=?", [
      req.params.id,
    ]);
    if (!row) return res.status(404).json({ error: "Not found" });

    await db("DELETE FROM sanpham WHERE id=?", [req.params.id]);
    if (row.image) row.image.split(",").forEach(deleteImg);

    io.emit("REFRESH_DATA");
    res.json({ message: "Đã xóa" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- 5. API DANH MỤC ---

app.get("/api/categories-all", async (req, res) => {
  const data = await db(
    "SELECT id, name FROM categories WHERE status='active' ORDER BY name ASC"
  );
  res.json(data);
});

app.get("/api/categories", async (req, res) => {
  const page = +req.query.page || 1,
    limit = +req.query.limit || 10,
    search = req.query.search || "";
  const offset = (page - 1) * limit;
  const where = search ? `WHERE name LIKE '%${search}%'` : "";

  const [count] = await db(`SELECT COUNT(*) as total FROM categories ${where}`);
  const data = await db(
    `SELECT * FROM categories ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  res.json({ page, limit, total: count.total, data });
});

app.post("/api/categories", async (req, res) => {
  await db(
    "INSERT INTO categories (name, icon, count, status, created_at, updated_at) VALUES (?, ?, 0, ?, NOW(), NOW())",
    [
      req.body.name,
      req.body.icon || "fa-solid fa-folder",
      req.body.status || "active",
    ]
  );
  // io.emit("REFRESH_CATEGORIES");
  res.status(201).json({ message: "Đã thêm" });
});

app.put("/api/categories/:id", async (req, res) => {
  await db(
    "UPDATE categories SET name=?, icon=?, status=?, updated_at=NOW() WHERE id=?",
    [req.body.name, req.body.icon, req.body.status, req.params.id]
  );
  // io.emit("REFRESH_CATEGORIES");
  res.json({ message: "Đã sửa" });
});

app.delete("/api/categories/:id", async (req, res) => {
  await db("DELETE FROM categories WHERE id=?", [req.params.id]);
  // io.emit("REFRESH_CATEGORIES");
  res.json({ message: "Đã xóa" });
});

server.listen(port, () =>
  console.log(`Server chạy tại: http://localhost:${port}`)
);
