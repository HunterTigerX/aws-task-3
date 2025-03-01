import { OrderStatus } from "~/constants/order";
import { CartItem } from "~/models/CartItem";
import { Order } from "~/models/Order";
import { AvailableProduct, Product } from "~/models/Product";

export const products: Product[] = [
  {
    id: "1",
    title: "Gaming Laptop",
    description:
      "High-performance laptop with RGB keyboard, perfect for gaming and multitasking.",
    price: 1299.99,
  },
  {
    id: "2",
    title: "4K Monitor",
    description:
      "Ultra-sharp 27-inch 4K monitor with HDR support for stunning visuals.",
    price: 499.99,
  },
  {
    id: "3",
    title: "Mechanical Keyboard",
    description:
      "Durable mechanical keyboard with customizable RGB lighting and tactile switches.",
    price: 89.99,
  },
  {
    id: "4",
    title: "Wireless Mouse",
    description:
      "Ergonomic wireless mouse with adjustable DPI and long battery life.",
    price: 39.99,
  },
  {
    id: "5",
    title: "All-in-One Printer",
    description:
      "Compact printer with scanning, copying, and wireless printing capabilities.",
    price: 149.99,
  },
  {
    id: "6",
    title: "External SSD",
    description:
      "Portable SSD with 1TB storage and USB-C connectivity for fast data transfer.",
    price: 199.99,
  },
  {
    id: "7",
    title: "Gaming Headset",
    description:
      "Immersive gaming headset with 7.1 surround sound and noise-canceling microphone.",
    price: 79.99,
  },
  {
    id: "8",
    title: "Smart Thermostat",
    description:
      "Energy-efficient smart thermostat with Wi-Fi connectivity and voice control.",
    price: 249.99,
  },
  {
    id: "9",
    title: "Bluetooth Speaker",
    description:
      "Portable Bluetooth speaker with 20-hour battery life and waterproof design.",
    price: 59.99,
  },
  {
    id: "10",
    title: "USB-C Hub",
    description:
      "Compact USB-C hub with HDMI, USB-A, and SD card reader for laptops.",
    price: 29.99,
  },
  {
    id: "11",
    title: "Graphics Tablet",
    description:
      "Digital drawing tablet with pressure-sensitive pen for artists and designers.",
    price: 299.99,
  },
  {
    id: "12",
    title: "Wi-Fi Router",
    description:
      "High-speed dual-band Wi-Fi router with advanced security features.",
    price: 129.99,
  },
  {
    id: "13",
    title: "Fitness Tracker",
    description:
      "Waterproof fitness tracker with heart rate monitoring and sleep analysis.",
    price: 69.99,
  },
  {
    id: "14",
    title: "External Hard Drive",
    description:
      "2TB external hard drive with USB 3.0 for fast and reliable storage.",
    price: 89.99,
  },
  {
    id: "15",
    title: "Smart Light Bulb",
    description:
      "Wi-Fi-enabled smart bulb with adjustable colors and voice control compatibility.",
    price: 19.99,
  },
  {
    id: "16",
    title: "Gaming Chair",
    description:
      "Ergonomic gaming chair with lumbar support and adjustable armrests.",
    price: 199.99,
  },
  {
    id: "17",
    title: "Action Camera",
    description:
      "4K action camera with waterproof casing and image stabilization.",
    price: 149.99,
  },
  {
    id: "18",
    title: "Wireless Earbuds",
    description:
      "True wireless earbuds with noise cancellation and 24-hour battery life.",
    price: 129.99,
  },
  {
    id: "19",
    title: "NAS Drive",
    description:
      "Network-attached storage with 4TB capacity for home or office use.",
    price: 399.99,
  },
  {
    id: "20",
    title: "Smart Lock",
    description:
      "Keyless smart lock with fingerprint and Bluetooth connectivity.",
    price: 179.99,
  },
  {
    id: "21",
    title: "VR Headset",
    description:
      "Immersive VR headset with motion tracking and high-resolution display.",
    price: 299.99,
  },
  {
    id: "22",
    title: "Portable Projector",
    description:
      "Compact projector with 1080p resolution and built-in speakers.",
    price: 249.99,
  },
  {
    id: "23",
    title: "Smartwatch",
    description:
      "Fitness smartwatch with GPS, heart rate monitor, and smartphone notifications.",
    price: 199.99,
  },
  {
    id: "24",
    title: "Noise-Canceling Headphones",
    description:
      "Over-ear headphones with active noise cancellation and 30-hour battery life.",
    price: 349.99,
  },
  {
    id: "25",
    title: "USB Flash Drive",
    description: "128GB USB flash drive with fast data transfer speeds.",
    price: 24.99,
  },
  {
    id: "26",
    title: "Gaming Console",
    description:
      "Next-gen gaming console with 4K gaming and streaming capabilities.",
    price: 499.99,
  },
  {
    id: "27",
    title: "Smart Home Hub",
    description:
      "Central hub for controlling smart home devices with voice commands.",
    price: 129.99,
  },
  {
    id: "28",
    title: "Drone",
    description: "Compact drone with 4K camera and stable flight controls.",
    price: 299.99,
  },
  {
    id: "29",
    title: "E-Reader",
    description:
      "Lightweight e-reader with glare-free display and weeks-long battery life.",
    price: 129.99,
  },
  {
    id: "30",
    title: "Webcam",
    description:
      "1080p webcam with autofocus and built-in microphone for video calls.",
    price: 59.99,
  },
  {
    id: "31",
    title: "Power Bank",
    description: "20000mAh power bank with fast charging and dual USB ports.",
    price: 39.99,
  },
  {
    id: "32",
    title: "Smart Plug",
    description:
      "Wi-Fi-enabled smart plug for remote control of home appliances.",
    price: 19.99,
  },
  {
    id: "33",
    title: "Gaming Monitor",
    description:
      "27-inch gaming monitor with 144Hz refresh rate and G-Sync technology.",
    price: 349.99,
  },
  {
    id: "34",
    title: "Wireless Charger",
    description:
      "Fast wireless charger compatible with smartphones and earbuds.",
    price: 29.99,
  },
  {
    id: "35",
    title: "Bluetooth Keyboard",
    description:
      "Slim Bluetooth keyboard with long battery life for tablets and smartphones.",
    price: 49.99,
  },
  {
    id: "36",
    title: "Home Security Camera",
    description:
      "1080p security camera with night vision and motion detection.",
    price: 89.99,
  },
  {
    id: "37",
    title: "External DVD Drive",
    description:
      "Portable DVD drive for laptops and desktops with USB connectivity.",
    price: 34.99,
  },
  {
    id: "38",
    title: "Smart Scale",
    description:
      "Digital smart scale with body composition analysis and app integration.",
    price: 49.99,
  },
  {
    id: "39",
    title: "USB Microphone",
    description:
      "Studio-quality USB microphone for streaming, podcasting, and recording.",
    price: 99.99,
  },
  {
    id: "40",
    title: "Gaming Mouse Pad",
    description:
      "Large gaming mouse pad with non-slip base and smooth surface.",
    price: 19.99,
  },
  {
    id: "41",
    title: "Portable Scanner",
    description:
      "Handheld scanner for documents and photos with wireless connectivity.",
    price: 129.99,
  },
  {
    id: "42",
    title: "Smart Doorbell",
    description: "Video doorbell with motion detection and two-way audio.",
    price: 199.99,
  },
  {
    id: "43",
    title: "Wireless Headset",
    description:
      "Comfortable wireless headset with noise-canceling microphone.",
    price: 79.99,
  },
  {
    id: "44",
    title: "Mini PC",
    description:
      "Compact mini PC with powerful performance for home and office use.",
    price: 399.99,
  },
  {
    id: "45",
    title: "Digital Photo Frame",
    description:
      "10-inch digital photo frame with Wi-Fi and cloud storage support.",
    price: 99.99,
  },
  {
    id: "46",
    title: "Car Charger",
    description:
      "Dual-port car charger with fast charging for smartphones and tablets.",
    price: 14.99,
  },
  {
    id: "47",
    title: "Bluetooth Adapter",
    description:
      "Compact Bluetooth adapter for adding wireless audio to any device.",
    price: 9.99,
  },
  {
    id: "48",
    title: "HDMI Cable",
    description: "High-speed HDMI cable for 4K video and audio transmission.",
    price: 12.99,
  },
  {
    id: "49",
    title: "Laptop Stand",
    description:
      "Adjustable laptop stand for ergonomic positioning and better airflow.",
    price: 29.99,
  },
  {
    id: "50",
    title: "Surge Protector",
    description:
      "6-outlet surge protector with USB charging ports and safety features.",
    price: 24.99,
  },
];

export const availableProducts: AvailableProduct[] = products.map(
  (product, index) => ({ ...product, count: index + 1 })
);

export const cart: CartItem[] = [
  {
    product: {
      description: "Short Product Description1",
      id: "7567ec4b-b10c-48c5-9345-fc73c48a80aa",
      price: 24,
      title: "ProductOne",
    },
    count: 2,
  },
  {
    product: {
      description: "Short Product Description7",
      id: "7567ec4b-b10c-45c5-9345-fc73c48a80a1",
      price: 15,
      title: "ProductName",
    },
    count: 5,
  },
];

export const orders: Order[] = [
  {
    id: "1",
    address: {
      address: "some address",
      firstName: "Name",
      lastName: "Surname",
      comment: "",
    },
    items: [
      { productId: "7567ec4b-b10c-48c5-9345-fc73c48a80aa", count: 2 },
      { productId: "7567ec4b-b10c-45c5-9345-fc73c48a80a1", count: 5 },
    ],
    statusHistory: [
      { status: OrderStatus.Open, timestamp: Date.now(), comment: "New order" },
    ],
  },
  {
    id: "2",
    address: {
      address: "another address",
      firstName: "John",
      lastName: "Doe",
      comment: "Ship fast!",
    },
    items: [{ productId: "7567ec4b-b10c-48c5-9345-fc73c48a80aa", count: 3 }],
    statusHistory: [
      {
        status: OrderStatus.Sent,
        timestamp: Date.now(),
        comment: "Fancy order",
      },
    ],
  },
];
