<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Swal from 'sweetalert2';

const route = useRoute();
const router = useRouter();

// --- STATE ---
const product = ref(null);
const relatedProducts = ref([]);
const isLoading = ref(false);
const quantity = ref(1); // Số lượng khách muốn mua
const activeTab = ref('description');

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
    quantity.value = 1; // Reset quantity khi đổi sản phẩm

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

// --- EVENTS & LOGIC ---
const setMainImage = (img) => mainImage.value = img;

// VALIDATE: Tăng giảm số lượng bằng nút bấm
const updateQuantity = (change) => {
  const currentStock = product.value?.quantity || 0; // Lấy tồn kho hiện tại
  const newVal = quantity.value + change;

  // Không cho giảm dưới 1
  if (newVal < 1) return;

  // Không cho tăng quá tồn kho
  if (newVal > currentStock) {
    Swal.fire({
      icon: 'warning',
      title: 'Giới hạn số lượng',
      text: `Chỉ còn ${currentStock} sản phẩm trong kho!`,
      timer: 2000,
      showConfirmButton: false
    });
    return;
  }

  quantity.value = newVal;
};

// VALIDATE: Nhập trực tiếp vào ô input
const validateQuantityInput = () => {
  const currentStock = product.value?.quantity || 0;
  
  // Nếu nhập <= 0 hoặc để trống -> Reset về 1
  if (!quantity.value || quantity.value < 1) {
    quantity.value = 1;
  } 
  // Nếu nhập quá tồn kho -> Reset về tồn kho tối đa
  else if (quantity.value > currentStock) {
    quantity.value = currentStock;
    Swal.fire({
      icon: 'warning',
      title: 'Quá số lượng tồn kho',
      text: `Chúng tôi chỉ còn ${currentStock} sản phẩm.`,
      timer: 2000,
      showConfirmButton: false
    });
  }
};

// HÀM THÊM VÀO GIỎ HÀNG
const addToCart = async () => {
    // Check tồn kho lần cuối
    if (product.value.quantity <= 0) {
       Swal.fire('Hết hàng', 'Sản phẩm này tạm thời hết hàng.', 'error');
       return;
    }

    const userStr = localStorage.getItem('user_info') || localStorage.getItem('user');
    if (!userStr) {
        Swal.fire({
            icon: 'warning',
            title: 'Yêu cầu đăng nhập',
            text: 'Bạn cần đăng nhập để mua hàng!',
            confirmButtonColor: '#000',
            confirmButtonText: 'Đăng nhập ngay',
            showCancelButton: true
        }).then((result) => {
            if (result.isConfirmed) router.push('/login');
        });
        return;
    }

    const user = JSON.parse(userStr);

    try {
        const res = await fetch('http://localhost:8080/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user.id,
                product_id: product.value.id,
                quantity: quantity.value // Gửi số lượng từ ô input
            })
        });

        if (res.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Đã thêm vào giỏ!',
                text: `${product.value.name} x ${quantity.value}`,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
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
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black mx-auto"></div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="container mx-auto px-4 md:px-8 py-8 animate-fade-in">
      
      <!-- Breadcrumb -->
      <nav class="text-xs text-gray-500 font-medium uppercase tracking-wide mb-8">
        <router-link to="/" class="hover:text-black transition">Trang chủ</router-link> 
        <span class="mx-2 text-gray-300">/</span>
        <router-link to="/shop" class="hover:text-black transition">Sản phẩm</router-link>
        <span class="mx-2 text-gray-300">/</span>
        <span class="text-black">{{ product.name }}</span>
      </nav>

      <div class="flex flex-col lg:flex-row gap-10 xl:gap-16 mb-20">
        
        <!-- CỘT 1: HÌNH ẢNH (W-5/12) -->
        <div class="w-full lg:w-5/12">
          <!-- Main Image -->
          <div class="bg-gray-50 mb-4 relative overflow-hidden group border border-gray-100 rounded-lg">
             <div class="aspect-square relative flex items-center justify-center p-4">
                <img :src="mainImage" 
                     class="max-w-full max-h-full object-contain transition duration-500 group-hover:scale-105 mix-blend-multiply" 
                     alt="Product Image" 
                     @error="$event.target.src='https://via.placeholder.com/500x500?text=No+Image'">
             </div>
             <!-- Badge -->
             <span v-if="product.quantity > 0" class="absolute top-4 left-4 bg-white/90 backdrop-blur text-black text-[10px] font-bold px-3 py-1 uppercase tracking-widest shadow-sm border border-gray-100 rounded">
                {{ product.status === 1 ? 'Mới' : 'Còn hàng' }}
             </span>
             <span v-else class="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest shadow-sm rounded">Hết hàng</span>
          </div>

          <!-- Thumbnails -->
          <div class="grid grid-cols-5 gap-3" v-if="galleryImages.length > 1">
            <div v-for="(img, idx) in galleryImages" :key="idx" 
                 @click="setMainImage(img)" 
                 class="aspect-square bg-gray-50 cursor-pointer border rounded-md overflow-hidden transition hover:border-black p-1"
                 :class="mainImage === img ? 'border-black ring-1 ring-black' : 'border-transparent'">
              <img :src="img" class="w-full h-full object-contain mix-blend-multiply">
            </div>
          </div>
        </div>

        <!-- CỘT 2: THÔNG TIN (W-7/12) -->
        <div class="w-full lg:w-7/12 flex flex-col">
          
          <!-- Tên & Giá -->
          <h1 class="text-3xl font-black text-gray-900 mb-2 leading-tight">{{ product.name }}</h1>
          
          <div class="flex items-center gap-4 mb-4">
            <span class="text-2xl font-bold text-black">{{ formatCurrency(product.price) }}</span>
            <div class="h-4 w-px bg-gray-300 mx-2"></div>
            
            <!-- Trạng thái kho -->
            <div class="flex items-center gap-2">
                <span class="relative flex h-2.5 w-2.5">
                  <span v-if="product.quantity > 0" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5" :class="product.quantity > 0 ? 'bg-green-500' : 'bg-red-500'"></span>
                </span>
                <span class="text-sm font-medium" :class="product.quantity > 0 ? 'text-green-600' : 'text-red-600'">
                    {{ product.quantity > 0 ? `Sẵn có: ${product.quantity} sản phẩm` : 'Hết hàng' }}
                </span>
            </div>
          </div>

          <!-- Mô tả ngắn -->
          <div class="prose prose-sm text-gray-600 mb-8 max-w-none line-clamp-3">
             <div v-html="product.description"></div>
          </div>

          <!-- Divider -->
          <div class="w-full h-px bg-gray-100 mb-8"></div>

          <!-- ACTION SECTION: Quantity & Add Cart -->
          <div class="flex flex-col sm:flex-row gap-4 mb-8 items-end sm:items-stretch">
            
            <!-- 1. Input Số Lượng (Có Validate) -->
            <div class="flex flex-col gap-1.5 w-full sm:w-auto">
                <span class="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Số lượng</span>
                <div class="flex items-center border border-gray-300 rounded-lg h-12 w-full sm:w-32 bg-white">
                  <!-- Nút Giảm -->
                  <button @click="updateQuantity(-1)" :disabled="quantity <= 1" class="w-10 h-full flex items-center justify-center hover:bg-gray-50 text-gray-600 rounded-l-lg transition disabled:opacity-50">
                    <i class="fa-solid fa-minus text-xs"></i>
                  </button>
                  
                  <!-- Ô Nhập -->
                  <input type="number" 
                         v-model.number="quantity" 
                         @change="validateQuantityInput"
                         class="w-12 h-full text-center outline-none bg-transparent font-bold text-black text-sm border-none focus:ring-0 appearance-none">
                  
                  <!-- Nút Tăng -->
                  <button @click="updateQuantity(1)" :disabled="quantity >= product.quantity" class="w-10 h-full flex items-center justify-center hover:bg-gray-50 text-gray-600 rounded-r-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <i class="fa-solid fa-plus text-xs"></i>
                  </button>
                </div>
            </div>

            <!-- 2. Nút Thêm Vào Giỏ -->
            <div class="flex-1 flex flex-col gap-1.5 w-full">
                <span class="hidden sm:block text-[10px] font-bold uppercase text-transparent tracking-wider select-none">.</span>
                <button 
                  @click="addToCart"
                  :disabled="product.quantity <= 0"
                  class="h-12 bg-black text-white font-bold uppercase text-sm tracking-widest rounded-lg hover:bg-gray-800 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-3 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <i class="fa-solid fa-bag-shopping"></i>
                  {{ product.quantity > 0 ? 'Thêm vào giỏ hàng' : 'Đã hết hàng' }}
                </button>
            </div>

            <!-- 3. Wishlist -->
            <div class="flex flex-col gap-1.5 hidden sm:flex">
               <span class="text-[10px] font-bold uppercase text-transparent tracking-wider select-none">.</span>
               <button class="w-12 h-12 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition">
                  <i class="fa-regular fa-heart text-lg"></i>
               </button>
            </div>
          </div>

          <!-- Meta Info -->
          <div class="space-y-3 pt-6 border-t border-gray-100 text-sm">
            <div class="flex items-center">
                <span class="w-24 text-gray-500">Mã SP:</span>
                <span class="font-medium text-gray-900">#{{ product.id }}</span>
            </div>
            <div class="flex items-center">
                <span class="w-24 text-gray-500">Danh mục:</span>
                <span class="font-medium text-gray-900 hover:underline cursor-pointer">{{ product.category_name || 'Thời trang' }}</span>
            </div>
            <div class="flex items-center">
                <span class="w-24 text-gray-500">Vận chuyển:</span>
                <span class="text-gray-500 italic">Miễn phí vận chuyển cho đơn hàng trên 1 triệu</span>
            </div>
          </div>

        </div>
      </div>

      <!-- TABS: Description & Reviews -->
      <div class="mb-20">
        <div class="flex border-b border-gray-200 mb-8">
          <button @click="activeTab = 'description'" class="pb-4 px-6 text-sm font-bold uppercase tracking-widest border-b-2 transition" :class="activeTab === 'description' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'">Mô tả sản phẩm</button>
          <button @click="activeTab = 'reviews'" class="pb-4 px-6 text-sm font-bold uppercase tracking-widest border-b-2 transition" :class="activeTab === 'reviews' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'">Đánh giá</button>
        </div>

        <div class="bg-gray-50 rounded-xl p-8 md:p-10 border border-gray-100">
          <div v-if="activeTab === 'description'">
            <div class="prose prose-sm max-w-none text-gray-600 leading-relaxed [&>img]:rounded-lg [&>img]:mx-auto [&>h2]:text-black" v-html="product.description"></div>
          </div>
          <div v-else class="text-center py-10 text-gray-500 italic">
             Hiện chưa có đánh giá nào cho sản phẩm này.
          </div>
        </div>
      </div>

      <!-- RELATED PRODUCTS -->
      <div v-if="relatedProducts.length > 0">
        <h3 class="text-xl font-bold uppercase tracking-tighter mb-6">Có thể bạn sẽ thích</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div v-for="relProd in relatedProducts" :key="relProd.id" class="group cursor-pointer" @click="router.push(`/productDetail/${relProd.id}`)">
            <div class="relative overflow-hidden aspect-[3/4] bg-gray-100 rounded-lg mb-3 border border-gray-100">
              <img :src="getFullImageUrl(relProd.image ? relProd.image.split(',')[0] : '')" 
                   class="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                   @error="$event.target.src='https://via.placeholder.com/300x400?text=No+Image'">
            </div>
            <h3 class="text-sm font-bold text-gray-900 group-hover:underline truncate">{{ relProd.name }}</h3>
            <p class="text-gray-500 text-xs mt-1">{{ formatCurrency(relProd.price) }}</p>
          </div>
        </div>
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

/* Ẩn nút tăng giảm mặc định của input number */
input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}
</style>