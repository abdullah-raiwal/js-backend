import {deleteFromCloudinary} from "./utils/cloudinary.js"

const res = await deleteFromCloudinary(
  "https://res.cloudinary.com/ddrjfbmbg/video/upload/v1708363000/vqpcjhpzdxoqldhqcgtt.mp4",
  "video"
);

console.log(res);

