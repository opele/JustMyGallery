using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace ImageFinder {
    class ImageUtil {

        public static string getPreviewPath(string originalPath) {
            string extension = originalPath.Substring(originalPath.LastIndexOf("."));
            string prevImgPath = originalPath.Remove(originalPath.LastIndexOf(".")) + getPrieviewImageSuffix() + extension;
            return prevImgPath;
        }

        public static bool isOriginalImg(string filePath) {
            return (filePath.EndsWith(".png") || filePath.EndsWith(".jpg") || filePath.EndsWith(".jpeg"))
                && !isPreviewImg(filePath);
        }

        public static bool isPreviewImg(string filePath) {
            string removedExtension = filePath.Remove(filePath.LastIndexOf("."));
            return removedExtension.EndsWith(getPrieviewImageSuffix());
        }

        public static string getPrieviewImageSuffix() {
            return "Preview" + Program.PREVIEW_WIDTH_PX + "px";
        }

        /**
         * Returns resized image with specified width scaling the height accordingly.
         */
        public static Bitmap ResizeImage(string imagePath, int newWidth) {

            using (Image img = Image.FromFile(imagePath)) {

                float ratio = img.Height / (float)img.Width;
                int newHeight = (int) (newWidth * ratio);

                return ResizeImage(img, newWidth, newHeight);
            }
        }

        /// <summary>
        /// Resize the image to the specified width and height.
        /// 
        /// source: https://stackoverflow.com/questions/1922040/how-to-resize-an-image-c-sharp
        /// </summary>
        /// <param name="image">The image to resize.</param>
        /// <param name="width">The width to resize to.</param>
        /// <param name="height">The height to resize to.</param>
        /// <returns>The resized image.</returns>
        public static Bitmap ResizeImage(Image image, int width, int height) {
            var destRect = new Rectangle(0, 0, width, height);
            var destImage = new Bitmap(width, height);

            destImage.SetResolution(image.HorizontalResolution, image.VerticalResolution);

            using (var graphics = Graphics.FromImage(destImage)) {
                graphics.CompositingMode = CompositingMode.SourceCopy;
                graphics.CompositingQuality = CompositingQuality.HighQuality;
                graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                graphics.SmoothingMode = SmoothingMode.HighQuality;
                graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;

                using (var wrapMode = new System.Drawing.Imaging.ImageAttributes()) {
                    wrapMode.SetWrapMode(WrapMode.TileFlipXY);
                    graphics.DrawImage(image, destRect, 0, 0, image.Width, image.Height, GraphicsUnit.Pixel, wrapMode);
                }
            }

            return destImage;
        }


        public static ImageCodecInfo GetEncoderInfo(String mimeType) {
            int j;
            ImageCodecInfo[] encoders;
            encoders = ImageCodecInfo.GetImageEncoders();
            for (j = 0; j < encoders.Length; ++j) {
                if (encoders[j].MimeType == mimeType)
                    return encoders[j];
            }
            return null;
        }


        // source: https://stackoverflow.com/questions/180030/how-can-i-find-out-when-a-picture-was-actually-taken-in-c-sharp-running-on-vista/39839380
        //we init this once so that if the function is repeatedly called
        //it isn't stressing the garbage man
        private static Regex r = new Regex(":");

        //retrieves the datetime WITHOUT loading the whole image
        public static DateTime GetDateTakenFromImage(string path) {
            using (FileStream fs = new FileStream(path, FileMode.Open, FileAccess.Read))
            using (Image myImage = Image.FromStream(fs, false, false)) {
                PropertyItem propItem = myImage.GetPropertyItem(36867);
                string dateTaken = r.Replace(Encoding.UTF8.GetString(propItem.Value), "-", 2);
                return DateTime.Parse(dateTaken);
            }
        }

        public static string GetTagsFromImage(string path) {

            // png does not support this tag
            if (!path.EndsWith(".jpg") && !path.EndsWith(".jpeg")) return null;

            using (FileStream fs = new FileStream(path, FileMode.Open, FileAccess.Read))
            using (Image myImage = Image.FromStream(fs, false, false)) {
                PropertyItem propItem = myImage.GetPropertyItem(40094);
                return Encoding.Unicode.GetString(propItem.Value).Replace("\0", string.Empty).Replace(":", ",").Replace(";", ",").ToLower();
            }
        }

    }
}
