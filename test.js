const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mysql = require("mysql");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

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

app.post("/api/products", upload.array("images", 5), async (req, res) => {
  try {
    const { name, price, description, status, category_id, quantity } =
      req.body;
    const images = req.files.map((f) => f.filename).join(",");

    await db(
      "INSERT INTO sanpham (name, price, description, image, status, category_id, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        price,
        description || "",
        images,
        status || 1,
        category_id || null,
        quantity || null,
      ]
    );

    io.emit("REFRESH_DATA");
    res.status(201).json({ message: "Thêm thành công" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/products/:id", upload.array("images", 5), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      price,
      description,
      status,
      category_id,
      keepOldImages,
      quantity,
    } = req.body;

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
      "UPDATE sanpham SET name=?, price=?, description=?, image=?, status=?, category_id=?, quantity=? WHERE id=?",
      [
        name,
        price,
        description,
        finalImgs.join(","),
        status,
        category_id || null,
        quantity || 0,
        id,
      ]
    );

    io.emit("REFRESH_DATA");
    res.json({ message: "Cập nhật thành công" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

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

// --- API DANH MỤC ---
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
  res.status(201).json({ message: "Đã thêm" });
});

app.put("/api/categories/:id", async (req, res) => {
  await db(
    "UPDATE categories SET name=?, icon=?, status=?, updated_at=NOW() WHERE id=?",
    [req.body.name, req.body.icon, req.body.status, req.params.id]
  );
  res.json({ message: "Đã sửa" });
});

app.delete("/api/categories/:id", async (req, res) => {
  await db("DELETE FROM categories WHERE id=?", [req.params.id]);
  res.json({ message: "Đã xóa" });
});

// --- AUTH ---
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const [existingUser] = await db("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (existingUser)
      return res.status(400).json({ error: "Email này đã được sử dụng!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await db(
      "INSERT INTO users (name, email, password, phone, role, status, created_at) VALUES (?, ?, ?, ?, 'user', 'active', NOW())",
      [name, email, hashedPassword, phone || ""]
    );
    res.status(201).json({ message: "Đăng ký thành công!" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [user] = await db("SELECT * FROM users WHERE email = ?", [email]);
    if (!user)
      return res.status(400).json({ error: "Sai email hoặc mật khẩu!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Sai email hoặc mật khẩu!" });

    const { password: pass, ...userInfo } = user;
    res.json({ message: "Đăng nhập thành công", user: userInfo });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- GIỎ HÀNG (QUAN TRỌNG: ĐÃ CẬP NHẬT LOGIC CHECK TỒN KHO) ---

// 1. Thêm vào giỏ hàng
app.post("/api/cart", async (req, res) => {
  try {
    const { user_id, product_id, quantity } = req.body;
    const addQty = Number(quantity);

    // B1: Lấy thông tin sản phẩm để biết tồn kho thực tế
    const [product] = await db("SELECT quantity FROM sanpham WHERE id = ?", [
      product_id,
    ]);

    if (!product) {
      return res.status(404).json({ error: "Sản phẩm không tồn tại" });
    }

    const stock = product.quantity || 0;

    // B2: Kiểm tra xem user đã có sản phẩm này trong giỏ chưa
    const [existingItem] = await db(
      "SELECT * FROM carts WHERE user_id = ? AND product_id = ?",
      [user_id, product_id]
    );

    // B3: Tính toán số lượng dự kiến sau khi thêm
    let newTotalQty = addQty;
    if (existingItem) {
      newTotalQty += existingItem.quantity;
    }

    // B4: CHECK TỒN KHO - Nếu vượt quá thì báo lỗi luôn
    if (newTotalQty > stock) {
      return res.status(400).json({
        error: `Kho chỉ còn ${stock} sản phẩm. Bạn đã có ${
          existingItem ? existingItem.quantity : 0
        } trong giỏ.`,
      });
    }

    // B5: Thực hiện Insert hoặc Update nếu đủ hàng
    if (existingItem) {
      await db("UPDATE carts SET quantity = ? WHERE id = ?", [
        newTotalQty,
        existingItem.id,
      ]);
    } else {
      await db(
        "INSERT INTO carts (user_id, product_id, quantity) VALUES (?, ?, ?)",
        [user_id, product_id, addQty]
      );
    }

    res.json({ message: "Đã thêm vào giỏ hàng" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Lỗi thêm vào giỏ hàng" });
  }
});

// 2. Lấy danh sách giỏ hàng (Cập nhật: Lấy thêm cột quantity của sản phẩm làm product_stock)
app.get("/api/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Đã thêm: p.quantity as product_stock để frontend biết giới hạn
    const sql = `
      SELECT c.id as cart_id, c.quantity as cart_quantity, 
             p.id as product_id, p.name, p.price, p.image, 
             p.quantity as product_stock,
             cate.name as category_name
      FROM carts c
      JOIN sanpham p ON c.product_id = p.id
      LEFT JOIN categories cate ON p.category_id = cate.id
      WHERE c.user_id = ?
    `;
    const rows = await db(sql, [userId]);

    const data = rows.map((item) => ({
      ...item,
      image: item.image ? item.image.split(",")[0] : "",
      image_full: item.image ? item.image.split(",").map(formatImg)[0] : "",
    }));

    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Lỗi lấy giỏ hàng" });
  }
});

// 3. Cập nhật số lượng trong giỏ (Cập nhật: Check tồn kho trước khi update)
app.put("/api/cart/:id", async (req, res) => {
  try {
    const cartId = req.params.id;
    const newQuantity = Number(req.body.quantity); // Số lượng mới mà khách muốn set

    if (newQuantity <= 0) {
      await db("DELETE FROM carts WHERE id = ?", [cartId]);
      return res.json({ message: "Đã xóa khỏi giỏ hàng" });
    }

    // B1: Lấy thông tin giỏ hàng hiện tại + tồn kho sản phẩm tương ứng
    const sqlCheck = `
        SELECT c.*, p.quantity as product_stock 
        FROM carts c
        JOIN sanpham p ON c.product_id = p.id
        WHERE c.id = ?
    `;
    const [cartItem] = await db(sqlCheck, [cartId]);

    if (!cartItem) {
      return res.status(404).json({ error: "Mục giỏ hàng không tồn tại" });
    }

    // B2: CHECK TỒN KHO
    if (newQuantity > cartItem.product_stock) {
      return res.status(400).json({
        error: `Số lượng vượt quá tồn kho! (Còn lại: ${cartItem.product_stock})`,
      });
    }

    // B3: Update nếu hợp lệ
    await db("UPDATE carts SET quantity = ? WHERE id = ?", [
      newQuantity,
      cartId,
    ]);

    res.json({ message: "Đã cập nhật giỏ hàng" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/cart/:id", async (req, res) => {
  try {
    await db("DELETE FROM carts WHERE id = ?", [req.params.id]);
    res.json({ message: "Đã xóa khỏi giỏ hàng" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- API CHECKOUT / ĐẶT HÀNG ---
app.post("/api/checkout", async (req, res) => {
  try {
    const {
      user_id,
      customer_name,
      customer_phone,
      customer_address,
      items,
      total_money,
    } = req.body;

    // 1. Tạo đơn hàng (Bảng orders)
    // Lưu ý: bảng orders liên kết user_id với bảng users
    const orderResult = await db(
      "INSERT INTO orders (user_id, customer_name, customer_phone, customer_address, total_money, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', NOW())",
      [user_id, customer_name, customer_phone, customer_address, total_money]
    );
    const orderId = orderResult.insertId;

    // 2. Lưu chi tiết đơn hàng VÀ Trừ tồn kho
    // Sử dụng Promise.all để đảm bảo tất cả lệnh chạy xong mới phản hồi
    const promises = items.map(async (item) => {
      // Lưu vào order_items (liên kết order_id)
      await db(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
        [orderId, item.product_id, item.cart_quantity, item.price]
      );

      // Trừ tồn kho trong bảng sanpham
      await db("UPDATE sanpham SET quantity = quantity - ? WHERE id = ?", [
        item.cart_quantity,
        item.product_id,
      ]);
    });

    await Promise.all(promises);

    // 3. Xóa giỏ hàng của user sau khi đặt xong
    await db("DELETE FROM carts WHERE user_id = ?", [user_id]);

    // Gửi thông báo realtime (nếu sau này bạn làm admin)
    io.emit("NEW_ORDER", { orderId, total_money, customer_name });

    res.status(200).json({ message: "Đặt hàng thành công!", orderId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Lỗi thanh toán: " + e.message });
  }
});

server.listen(port, () =>
  console.log(`Server chạy tại: http://localhost:${port}`)
);
