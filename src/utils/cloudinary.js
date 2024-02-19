import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: "ddrjfbmbg",
  api_key: "579397329649265",
  api_secret: "ApNooLmI4n8-iJ28mCRnPrbHfU0",
});

const uploadToCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

const deleteFromCloudinary = async (publicId, resource_type = "image") => {
  try {
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type,
    });
    console.log(response);

    return response;
  } catch (error) {
    console.log("error while deleting file from cloudinary ", error);
  }
};

export { uploadToCloudinary, deleteFromCloudinary };
