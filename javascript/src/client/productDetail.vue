<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Swal from 'sweetalert2'; // Dùng Swal cho đẹp

const route = useRoute();
const router = useRouter();

// --- STATE ---
const product = ref(null);
const relatedProducts = ref([]);
const isLoading = ref(false);
const quantity = ref(1);
const activeTab = ref('description');
const isExpanded = ref(false);

// Gallery
const mainImage = ref('');
const galleryImages = ref([]); 

// --- HELPERS ---
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const getFullImageUrl = (imgStr) => {
  if (!imgStr) return 'https://via.placeholder.com/500x500?text=No+Image';
  const s = imgStr.trim();
  return s.startsWith('http') ? s : `http://localhost:8080/uploads/${s}`;
};

const processImages = (imageString) => {
    if (!imageString) return ['https://via.placeholder.com/500x500?text=No+Image'];
    let imgs = imageString.split(',').map(s => getFullImageUrl(s));
    return imgs.length ? imgs : ['https://via.placeholder.com/500x500?text=No+Image'];
};

// --- API ---
const fetchProductDetail = async (id) => {
  isLoading.value = true;
  try {
    const res = await fetch(`http://localhost:8080/api/products/${id}`);
    if (!res.ok) throw new Error(res.status === 404 ? "Sản phẩm không tồn tại" : "Lỗi tải sản phẩm");
    
    const data = await res.json();
    product.value = data;
    
    // Setup Gallery
    const images = processImages(data.image);
    galleryImages.value = images;
    mainImage.value = images[0]; 

    fetchRelatedProducts();
  } catch (error) {
    console.error(error);
    router.replace('/shop'); 
  } finally {
    setTimeout(() => { isLoading.value = false; }, 300);
  }
};

const fetchRelatedProducts = async () => {
  try {
    const res = await fetch(`http://localhost:8080/api/home?page=1&limit=5`);
    const result = await res.json();
    if (result.data) {
        relatedProducts.value = result.data.filter(p => p.id != product.value.id).slice(0, 4);
    }
  } catch (error) {
    console.error("Lỗi tải sản phẩm liên quan:", error);
  }
};

// --- EVENTS ---
const setMainImage = (img) => mainImage.value = img;

const updateQuantity = (change) => {
  const newVal = quantity.value + change;
  if (newVal >= 1) quantity.value = newVal;
};

// HÀM THÊM VÀO GIỎ HÀNG (MỚI)
const addToCart = async () => {
    // 1. Kiểm tra đăng nhập (Lấy thông tin từ localStorage)
    const userStr = localStorage.getItem('user_info') || localStorage.getItem('user'); // Sửa key này theo cách bạn lưu khi login
    if (!userStr) {
        Swal.fire({
            icon: 'warning',
            title: 'Yêu cầu đăng nhập',
            text: 'Bạn cần đăng nhập để thêm sản phẩm vào giỏ!',
            confirmButtonText: 'Đăng nhập ngay',
            showCancelButton: true
        }).then((result) => {
            if (result.isConfirmed) {
                router.push('/login'); // Chuyển hướng trang login
            }
        });
        return;
    }

    const user = JSON.parse(userStr);

    try {
        const res = await fetch('http://localhost:8080/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user.id, // ID của user đang đăng nhập
                product_id: product.value.id,
                quantity: quantity.value
            })
        });

        if (res.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Đã thêm sản phẩm vào giỏ hàng',
                timer: 1500,
                showConfirmButton: false
            });
            // Có thể emit event hoặc dùng Pinia để cập nhật số lượng trên header giỏ hàng
        } else {
            throw new Error('Lỗi server');
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể thêm vào giỏ hàng' });
    }
};

watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchProductDetail(newId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

onMounted(() => {
  fetchProductDetail(route.params.id);
});
</script>

<template>
  <div class="product-detail-page bg-white min-h-screen pb-20 font-sans text-gray-800">
    <!-- Loading State -->
    <div v-if="isLoading || !product" class="h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mx-auto"></div>
        <p class="mt-4 text-gray-500 uppercase tracking-widest text-sm">Đang tải chi tiết...</p>
      </div>
    </div>

    <div v-else class="container mx-auto px-6 py-10 animate-fade-in">
        <!-- Breadcrumb & Content (Giữ nguyên như cũ) -->
        <!-- ... code hiển thị ảnh, tên giá ... -->
        
        <div class="flex flex-col lg:flex-row gap-12 mb-20">
            <!-- Left: Images -->
            <div class="w-full lg:w-1/2">
               <!-- ... code ảnh ... -->
               <div class="aspect-[4/5] bg-gray-100 mb-4 relative overflow-hidden group cursor-zoom-in border border-gray-100">
                  <img :src="mainImage" class="w-full h-full object-cover object-center transition duration-500 group-hover:scale-105" @error="$event.target.src='https://via.placeholder.com/500x500?text=Image+Error'">
               </div>
               <div class="grid grid-cols-4 gap-4" v-if="galleryImages.length > 1">
                  <div v-for="(img, idx) in galleryImages" :key="idx" @click="setMainImage(img)" class="aspect-square bg-gray-50 cursor-pointer border transition hover:opacity-100 overflow-hidden" :class="mainImage === img ? 'border-black opacity-100 ring-1 ring-black' : 'border-transparent opacity-60'">
                     <img :src="img" class="w-full h-full object-cover">
                  </div>
               </div>
            </div>

            <!-- Right: Info -->
            <div class="w-full lg:w-1/2 flex flex-col">
               <h1 class="text-3xl md:text-4xl font-black text-black uppercase tracking-tighter mb-4 leading-tight">{{ product.name }}</h1>
               <div class="flex items-center gap-4 mb-6">
                  <span class="text-2xl font-bold text-black">{{ formatCurrency(product.price) }}</span>
               </div>
               
               <div class="text-gray-600 leading-relaxed mb-8 border-b border-gray-100 pb-8 line-clamp-3 prose prose-sm max-w-none" v-html="product.description"></div>

               <!-- ADD TO CART ACTION -->
               <div class="flex flex-col sm:flex-row gap-4 mb-8">
                  <div class="flex items-center border border-gray-300 w-32 h-12">
                     <button @click="updateQuantity(-1)" class="w-10 h-full flex items-center justify-center hover:bg-gray-100 text-gray-600 transition">-</button>
                     <input type="text" :value="quantity" readonly class="w-12 h-full text-center outline-none bg-transparent font-bold text-black">
                     <button @click="updateQuantity(1)" class="w-10 h-full flex items-center justify-center hover:bg-gray-100 text-gray-600 transition">+</button>
                  </div>

                  <!-- Nút thêm vào giỏ đã được gắn sự kiện @click="addToCart" -->
                  <button @click="addToCart" class="flex-1 bg-black text-white h-12 font-bold uppercase tracking-widest hover:bg-gray-800 transition transform active:scale-95 shadow-lg flex items-center justify-center gap-3">
                     <i class="fa-solid fa-bag-shopping"></i> Thêm vào giỏ
                  </button>
               </div>
               
               <!-- ... Thông tin thêm ... -->
            </div>
        </div>
        
        <!-- ... Tabs Mô tả & Related Products (Giữ nguyên) ... -->
        <!-- Đã rút gọn để tập trung vào phần logic addToCart -->
        <!-- Bạn copy phần template tab và related product từ file cũ vào nhé -->
         <div class="mb-20">
            <!-- Tabs content here -->
         </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>