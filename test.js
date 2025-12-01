const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mysql = require("mysql");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// --- 1. KHỞI TẠO SERVER & CẤU HÌNH ---
const app = express();
const server = http.createServer(app);
const port = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
// Public thư mục ảnh để truy cập từ trình duyệt
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// Cấu hình Socket.io (Real-time)
const io = new Server(server, { cors: { origin: "*" } });
io.on("connection", (socket) => {
  // console.log("Client connected:", socket.id); 
});

// --- 2. CƠ SỞ DỮ LIỆU (MySQL) ---
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "javascript",
});

// Hàm wrapper để dùng Async/Await với MySQL
const db = (sql, params) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, result) => {
      err ? reject(err) : resolve(result);
    });
  });
};

// --- 3. CẤU HÌNH UPLOAD ẢNH (Multer) ---
const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
  fileFilter: (req, file, cb) => {
    file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("Chỉ chấp nhận file ảnh!"), false);
  },
});

// --- 4. HÀM TIỆN ÍCH (HELPER) ---
// Xóa file ảnh khỏi ổ cứng
const deleteFile = (filename) => {
  if (!filename) return;
  const filePath = path.join(uploadDir, filename.trim());
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

// Thêm domain vào tên ảnh để hiển thị frontend
const formatImageURL = (imgStr) => {
  if (!imgStr) return "";
  const addDomain = (s) => s.startsWith("http") ? s : `http://localhost:${port}/uploads/${s}`;
  return imgStr.includes(",") ? imgStr.split(",").map(addDomain).join(",") : addDomain(imgStr);
};

// =======================================================
// ==================== API SẢN PHẨM =====================
// =======================================================

// Lấy danh sách sản phẩm (có phân trang & tên danh mục)
app.get("/api/home", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const countRes = await db("SELECT COUNT(*) AS total FROM sanpham");
    
    // JOIN để lấy tên category
    const sql = `
        SELECT s.*, c.name as category_name 
        FROM sanpham s 
        LEFT JOIN categories c ON s.category_id = c.id 
        ORDER BY s.id DESC LIMIT ? OFFSET ?`;
    
    const products = await db(sql, [limit, offset]);
    
    // Format lại link ảnh trước khi trả về
    const data = products.map((item) => ({ ...item, image: formatImageURL(item.image) }));

    res.json({ page, limit, total: countRes[0].total, data });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Chi tiết sản phẩm
app.get("/api/products/:id", async (req, res) => {
  try {
    const rows = await db("SELECT * FROM sanpham WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Thêm sản phẩm mới
app.post("/api/products", upload.array("images", 5), async (req, res) => {
  try {
    const { name, price, description, status, category_id } = req.body;
    const images = req.files.map((f) => f.filename).join(",");
    const catId = (category_id && category_id !== "null") ? category_id : null;

    await db(
      "INSERT INTO sanpham (name, price, description, image, status, category_id) VALUES (?, ?, ?, ?, ?, ?)",
      [name, price, description || "", images, status || 1, catId]
    );

    io.emit("REFRESH_DATA"); // Báo client update lại list
    res.status(201).json({ message: "Thêm thành công" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi thêm dữ liệu" });
  }
});

// Cập nhật sản phẩm
app.put("/api/products/:id", upload.array("images", 5), async (req, res) => {
  try {
    const id = req.params.id;
    const { name, price, description, status, keepOldImages, category_id } = req.body;

    // Lấy ảnh cũ để xử lý
    const oldRows = await db("SELECT image FROM sanpham WHERE id = ?", [id]);
    if (oldRows.length === 0) return res.status(404).json({ error: "Không tìm thấy" });

    const oldImgs = oldRows[0].image ? oldRows[0].image.split(",") : [];
    const newImgs = req.files.map((f) => f.filename);
    
    let finalImgs = [];
    if (keepOldImages === "true") {
      finalImgs = [...oldImgs, ...newImgs];
    } else {
      // Nếu có ảnh mới upload -> xóa ảnh cũ, dùng ảnh mới
      if (newImgs.length > 0) {
        finalImgs = newImgs;
        oldImgs.forEach(deleteFile);
      } else {
        finalImgs = oldImgs;
      }
    }

    const catId = (category_id && category_id !== "null") ? category_id : null;

    await db(
      "UPDATE sanpham SET name=?, price=?, description=?, image=?, status=?, category_id=? WHERE id=?",
      [name, price, description, finalImgs.join(","), status, catId, id]
    );

    io.emit("REFRESH_DATA");
    res.json({ message: "Cập nhật thành công" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi cập nhật" });
  }
});

// Xóa sản phẩm
app.delete("/api/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const rows = await db("SELECT image FROM sanpham WHERE id = ?", [id]);
    
    if (rows.length === 0) return res.status(404).json({ error: "Không tìm thấy" });

    await db("DELETE FROM sanpham WHERE id = ?", [id]);
    
    // Xóa file ảnh trong thư mục upload
    if (rows[0].image) rows[0].image.split(",").forEach(deleteFile);

    io.emit("REFRESH_DATA");
    res.json({ message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi xóa dữ liệu" });
  }
});

// =======================================================
// ==================== API DANH MỤC =====================
// =======================================================

// Lấy tất cả danh mục (Dùng cho dropdown chọn danh mục)
app.get("/api/categories-all", async (req, res) => {
  try {
    const data = await db("SELECT id, name FROM categories WHERE status = 'active' ORDER BY name ASC");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Quản lý danh mục (Có phân trang & tìm kiếm)
app.get("/api/categories", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const offset = (page - 1) * limit;

    let query = "SELECT * FROM categories";
    let countQuery = "SELECT COUNT(*) AS total FROM categories";
    let params = [];

    if (search) {
      const searchStr = `%${search}%`;
      query += " WHERE name LIKE ?";
      countQuery += " WHERE name LIKE ?";
      params.push(searchStr);
    }

    query += " ORDER BY id DESC LIMIT ? OFFSET ?";
    const queryParams = search ? [params[0], limit, offset] : [limit, offset];
    const countParams = search ? [params[0]] : [];

    const [countRes, dataRes] = await Promise.all([
      db(countQuery, countParams),
      db(query, queryParams)
    ]);

    res.json({ page, limit, total: countRes[0].total, data: dataRes });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// CRUD Danh mục
app.post("/api/categories", async (req, res) => {
  try {
    const { name, icon, status } = req.body;
    await db(
      "INSERT INTO categories (name, icon, count, status, created_at, updated_at) VALUES (?, ?, 0, ?, NOW(), NOW())",
      [name, icon || "fa-solid fa-folder", status || "active"]
    );
    io.emit("REFRESH_CATEGORIES");
    res.status(201).json({ message: "Thêm thành công" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi thêm danh mục" });
  }
});

app.put("/api/categories/:id", async (req, res) => {
  try {
    const { name, icon, status } = req.body;
    await db(
      "UPDATE categories SET name=?, icon=?, status=?, updated_at=NOW() WHERE id=?",
      [name, icon, status, req.params.id]
    );
    io.emit("REFRESH_CATEGORIES");
    res.json({ message: "Cập nhật thành công" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi cập nhật" });
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  try {
    await db("DELETE FROM categories WHERE id = ?", [req.params.id]);
    io.emit("REFRESH_CATEGORIES");
    res.json({ message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi xóa danh mục" });
  }
});

// --- KHỞI CHẠY ---
server.listen(port, () => console.log(`🚀 Server running: http://localhost:${port}`));