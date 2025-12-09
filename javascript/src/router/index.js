import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: "/",
    component: () => import('@/layout/userLayout.vue'), 
    children: [
      { 
        path: "", 
        name: "Home",
        component: () => import('@/client/index.vue') 
      },
      { 
        path: "/login", 
        name: "Login",
        component: () => import('@/client/login.vue') 
      },
      { 
        path: "/register", 
        name: "Register",
        component: () => import('@/client/register.vue') 
      },
      { 
        path: "/shop", 
        name: "Shop",
        component: () => import('@/client/shop.vue') 
      },
      { 
        path: "/productDetail/:id", 
        name: "Product-detail",
        component: () => import('@/client/productDetail.vue') 
      },
      { 
        path: "/cart", 
        name: "Cart",
        component: () => import('@/client/cart.vue') 
      },
      { 
        path: "/checkout", 
        name: "Checkout",
        component: () => import('@/client/checkout.vue') 
      },
      { 
        path: "/wishlist", 
        name: "Wishlist",
        component: () => import('@/client/wishlist.vue') 
      },
    ],
  },
  {
    path: "/admin",
    component: () => import('@/layout/adminLayout.vue'),
    children: [
      { 
        path: "", 
        redirect: "/admin/products" 
      }, 
      { 
        path: "products", 
        name: "AdminProducts",
        component: () => import('@/admin/product.vue') 
      },
      { 
        path: "categories", 
        name: "AdminCategories",
        component: () => import('@/admin/categories.vue') 
      },
      { 
        path: "users", 
        name: "AdminUsers",
        component: () => import('@/admin/users.vue') 
      },
      { 
        path: "Orders", 
        name: "AdminOrders",
        component: () => import('@/admin/order.vue') 
      },
    ],
  },

  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import('@/client/notFound.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router