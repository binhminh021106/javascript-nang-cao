-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 01, 2025 at 02:09 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `javascript`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `icon` varchar(70) NOT NULL,
  `count` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `status` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `icon`, `count`, `created_at`, `updated_at`, `status`) VALUES
(1, 'Điện Thoại', 'fa-solid fa-mobile', 0, '2025-12-01 09:39:15', '2025-12-01 09:41:03', 'active');

-- --------------------------------------------------------

--
-- Table structure for table `sanpham`
--

CREATE TABLE `sanpham` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` tinyint(1) DEFAULT 1,
  `price` int(11) NOT NULL,
  `image` varchar(255) NOT NULL,
  `category_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sanpham`
--

INSERT INTO `sanpham` (`id`, `name`, `description`, `status`, `price`, `image`, `category_id`, `created_at`, `updated_at`) VALUES
(84, 'IPhone 17 Pro Max 256GB Cam Vũ Trụ', '<h3>iPhone 17 Pro Max: Tuyệt phẩm công nghệ từ Apple</h3><p class=\"ql-align-center\"><img src=\"https://iphonethanhnhan.vn/upload/filemanager/iphone%2017/iphone-17-pro-max.jpg\" alt=\"iPhone 17 Pro max\" height=\"736\"></p><p>Apple luôn mang đến những cải tiến đột phá với mỗi dòng iPhone mới, và iPhone 17 Pro Max không phải là ngoại lệ. Sản phẩm này hứa hẹn sẽ thiết lập một tiêu chuẩn mới cho smartphone cao cấp với thiết kế ấn tượng, hiệu năng mạnh mẽ và nhiều công nghệ tiên tiến. Hãy cùng&nbsp;<strong>Thanh Nhàn Apple</strong>&nbsp;khám phá mọi điều thú vị về iPhone 17 Pro Max ngay dưới đây!</p><h3>Thiết kế sang trọng và bền bỉ</h3><p>Theo nhiều nguồn tin rò rỉ, iPhone 17 Pro Max sẽ được trang bị&nbsp;<strong>khung nhôm cao cấp</strong>&nbsp;thay vì titanium, giúp giảm trọng lượng nhưng vẫn đảm bảo độ bền. Thiết kế camera cũng có sự thay đổi lớn với&nbsp;<strong>cụm camera thanh ngang</strong>&nbsp;thay vì cụm ba camera vuông truyền thống, mang đến diện mạo hiện đại và khác biệt.</p><p>Mặt lưng của máy tiếp tục sử dụng&nbsp;<strong>kính cường lực</strong>&nbsp;với công nghệ phủ mờ, giúp chống bám vân tay và tăng độ bền. Máy sẽ có&nbsp;<strong>4 tùy chọn màu sắc</strong>&nbsp;gồm:</p><ul><li><strong>Titan Đen</strong></li><li><br></li><li><strong>Titan Trắng</strong></li><li><br></li><li><strong>Titan Xanh Lá</strong></li><li><br></li><li><strong>Titan Tím</strong></li></ul><p class=\"ql-align-center\"><img src=\"https://iphonethanhnhan.vn/upload/filemanager/iphone%2017/iphone-17-pro-8.png\" alt=\"iPhone 17 Pro max\" height=\"600\"></p><p>Ngoài ra, có thể Apple sẽ bổ sung một phiên bản màu đặc biệt, mang phong cách tinh tế và sang trọng hơn.</p><h3>Màn hình OLED 6.9 inch đỉnh cao</h3><p>iPhone 17 Pro Max được dự đoán sẽ sở hữu&nbsp;<strong>màn hình OLED 6.9 inch</strong>&nbsp;với công nghệ&nbsp;<strong>ProMotion 120Hz</strong>, mang lại trải nghiệm hình ảnh mượt mà, sống động. Công nghệ LTPO tiên tiến giúp tối ưu hóa tần số quét từ&nbsp;<strong>1Hz đến 120Hz</strong>, giúp tiết kiệm pin đáng kể. Ngoài ra, tính năng&nbsp;<strong>Always-On Display</strong>&nbsp;cũng được cải thiện để hiển thị thông tin một cách hiệu quả hơn.</p><h3>Hiệu năng mạnh mẽ với chip A19 Pro</h3><p class=\"ql-align-center\"><img src=\"https://iphonethanhnhan.vn/upload/filemanager/iphone%2017/iphone-17-pro-7.jpg\" alt=\"iPhone 17pro max\" height=\"800\"></p><p>Sức mạnh của iPhone 17 Pro Max đến từ con chip&nbsp;<strong>A19 Pro</strong>&nbsp;sản xuất trên tiến trình&nbsp;<strong>3nm N3P</strong>&nbsp;của TSMC. Đây là bộ vi xử lý mạnh mẽ nhất từ trước đến nay của Apple, mang lại hiệu suất vượt trội cùng khả năng tiết kiệm năng lượng tối ưu.</p><p>Máy sẽ có&nbsp;<strong>RAM 12GB</strong>, giúp cải thiện khả năng đa nhiệm và hỗ trợ tốt hơn cho các tính năng AI thông minh. Nhờ vào hệ thống&nbsp;<strong>Apple Intelligence</strong>, iPhone 17 Pro Max có thể xử lý nhanh chóng các tác vụ nặng như:</p><ul><li>Chỉnh sửa video 4K chuyên nghiệp</li><li><br></li><li>Chơi game đồ họa cao</li><li><br></li><li>Xử lý dữ liệu AI nhanh chóng</li></ul><h3>Thời gian ra mắt iPhone 17 Pro Max</h3><p>Dự kiến, Apple sẽ ra mắt iPhone 17 Pro Max vào&nbsp;<strong>tháng 9 năm 2025</strong>, với các đơn đặt hàng bắt đầu từ cuối tháng 9 hoặc đầu tháng 10.</p><h3>Giá bán dự kiến</h3><p>Giá bán của iPhone 17 Pro Max có thể sẽ tương đương hoặc nhỉnh hơn so với phiên bản tiền nhiệm. Dưới đây là mức giá tham khảo:</p><ul><li><strong>iPhone 17 Pro Max 256GB</strong>: từ&nbsp;<strong>1.299 USD</strong></li><li><br></li><li><strong>iPhone 17 Pro Max 512GB</strong>: từ&nbsp;<strong>1.499 USD</strong></li><li><br></li><li><strong>iPhone 17 Pro Max 1TB</strong>: từ&nbsp;<strong>1.699 USD</strong></li></ul><p>Tại Việt Nam, giá có thể thay đổi tùy theo chính sách nhập khẩu và thuế.</p><p class=\"ql-align-center\"><img src=\"https://iphonethanhnhan.vn/upload/filemanager/iphone%2017/iphone-17-pro-6.jpg\" alt=\"iphone 17 pro max\" height=\"800\" width=\"800\"></p><h3>Kết luận</h3><p>iPhone 17 Pro Max hứa hẹn sẽ là một trong những&nbsp;<strong>chiếc smartphone đỉnh cao nhất năm 2025</strong>&nbsp;với nhiều cải tiến đáng giá từ thiết kế đến hiệu năng. Nếu bạn đang tìm kiếm một thiết bị&nbsp;<strong>mạnh mẽ, sang trọng và bền bỉ</strong>, đây chắc chắn là sự lựa chọn hoàn hảo.</p><p>Hãy theo dõi&nbsp;<strong>Thanh Nhàn Apple</strong>&nbsp;để cập nhật thông tin mới nhất và đặt hàng ngay khi sản phẩm chính thức lên kệ!</p><p>Tham khảo thêm những sản phẩm khác tại Thanh Nhàn:</p><ul><li><a href=\"https://iphonethanhnhan.vn/iphone-air-1tb-chinh-hang-vna\" rel=\"noopener noreferrer\" target=\"_blank\" style=\"color: rgb(13, 110, 253);\">iPhone Air 1TB Chính Hãng VN/A</a></li><li><a href=\"https://iphonethanhnhan.vn/iphone-air-256gb-chinh-hang-vna\" rel=\"noopener noreferrer\" target=\"_blank\" style=\"color: rgb(13, 110, 253);\">iPhone Air 256GB Chính Hãng VN/A</a></li><li><a href=\"https://iphonethanhnhan.vn/iphone-air-512gb-chinh-hang-vna\" rel=\"noopener noreferrer\" target=\"_blank\" style=\"color: rgb(13, 110, 253);\">iPhone Air 512GB Chính Hãng VN/A</a></li><li><a href=\"https://iphonethanhnhan.vn/iphone-17-512gb-chinh-hang-vna\" rel=\"noopener noreferrer\" target=\"_blank\" style=\"color: rgb(13, 110, 253);\">iPhone 17 512GB Chính Hãng VN/A</a></li><li><a href=\"https://iphonethanhnhan.vn/iphone-17-256gb-chinh-hang-vna\" rel=\"noopener noreferrer\" target=\"_blank\" style=\"color: rgb(13, 110, 253);\">iPhone 17 256GB Chính Hãng VN/A</a></li><li><a href=\"https://iphonethanhnhan.vn/iphone-17-pro-256gb-chinh-hang-vna\" rel=\"noopener noreferrer\" target=\"_blank\" style=\"color: rgb(13, 110, 253);\">iPhone 17 Pro 256GB Chính Hãng VN/A</a></li><li><a href=\"https://iphonethanhnhan.vn/iphone-17-pro-512gb-chinh-hang-vna\" rel=\"noopener noreferrer\" target=\"_blank\" style=\"color: rgb(13, 110, 253);\">iPhone 17 Pro 512GB Chính Hãng VN/A</a></li><li><a href=\"https://iphonethanhnhan.vn/iphone-17-pro-1tb-chinh-hang-vna\" rel=\"noopener noreferrer\" target=\"_blank\" style=\"color: rgb(13, 110, 253);\">iPhone 17 Pro 1TB Chính Hãng VN/A</a></li></ul><p><br></p>', 1, 50000000, '1764557138166-17promax1.webp,1764557138168-17promax2.webp,1764557138168-17promax3.webp', 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(50) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `address` varchar(255) NOT NULL,
  `google_id` varchar(255) NOT NULL,
  `avatar_url` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `status` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sanpham`
--
ALTER TABLE `sanpham`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_category` (`category_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `sanpham`
--
ALTER TABLE `sanpham`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `sanpham`
--
ALTER TABLE `sanpham`
  ADD CONSTRAINT `fk_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
