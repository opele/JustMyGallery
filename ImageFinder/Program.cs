using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.IO.Pipes;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ImageFinder {

    /**
     * Outputs image paths to a text file relative to the root path of the application.
     * The paths are output in JSON array format, so it can be used in Javascript for scr attribute of img html elements.
     */
    class Program {

        private const string OUTPUT_FILE_NAME = "imageData.txt";
        private const int MAX_DEPTH = 4;
        public const int PREVIEW_WIDTH_PX = 230; // can not be changes because currently hardcoded in gallery html
        private const int PREVIEW_IMG_QUALITY = 75;

        enum Option {
            ListAndPrev,
            List,
            RegenPrev,
            DelPrev,
            SetQuality,
            SetMaxDepth
        }

        static StreamWriter output;
        static int imgListCount;
        static int imgPrevGenCount;
        static int imgPrevDelCount;
        static string rootDirPath;
        static Option? option;
        static int previewImgQuality = -1;
        static int maxDepth = -1;

        static void Main(string[] args) {

            option = null;
            imgListCount = 0;
            imgPrevGenCount = 0;
            imgPrevDelCount = 0;
            rootDirPath = null;
            output = null;
            previewImgQuality = PREVIEW_IMG_QUALITY;
            maxDepth = MAX_DEPTH;

            Console.WriteLine("This program generates data about images for a gallery website. " +
                "It can generate preview images and a text file containing the list of images relative to the directory the app is started from. " +
                "The contents of this text file are to be copy pasted into the javascript part of the html file.");

            while (option == null) {
                Console.WriteLine();
                Console.WriteLine("Pick an action by typing the number: ");
                Console.WriteLine("1. Generate image data and missing preview images");
                Console.WriteLine("2. Generate image data only");
                Console.WriteLine("3. Regenerate all preview images");
                Console.WriteLine("4. Delete all preview images");
                Console.WriteLine("5. Set the quality of preview images (current value is " + previewImgQuality + ")");
                Console.WriteLine("6. Set the number of sub-directories to search for image data (current value is " + maxDepth + ")");

                switch (Console.ReadKey().Key) {
                    case ConsoleKey.D1: { option = Option.ListAndPrev; } break;
                    case ConsoleKey.D2: { option = Option.List; } break;
                    case ConsoleKey.D3: { option = Option.RegenPrev; } break;
                    case ConsoleKey.D4: { option = Option.DelPrev; } break;
                    case ConsoleKey.D5: { option = Option.SetQuality; }; break;
                    case ConsoleKey.D6: { option = Option.SetMaxDepth; }; break;
                }
                Console.WriteLine();

                if (option == Option.SetQuality) {
                    Console.WriteLine("Type the number for the preview image quality (between 0 and 100) and confirm with return: ");
                    String input = Console.ReadLine();

                    int inputQuality = -1;
                    bool success = int.TryParse(input, out inputQuality);

                    if (!success || inputQuality < 0 || inputQuality > 100) {
                        Console.WriteLine();
                        Console.WriteLine("The input '" + input + "' is not valid");
                    } else {
                        previewImgQuality = inputQuality;
                        Console.WriteLine("Updated quality to new value: " + inputQuality);
                    }

                    option = null;
                }

                if (option == Option.SetMaxDepth) {
                    Console.WriteLine("Type the number of the maximum depth of image directories to search and confirm with return: ");
                    String input = Console.ReadLine();

                    int inputMaxDepth = -1;
                    bool success = int.TryParse(input, out inputMaxDepth);

                    if (!success || inputMaxDepth < 0 || inputMaxDepth > 100) {
                        Console.WriteLine();
                        Console.WriteLine("The input '" + input + "' is not valid");
                    } else {
                        maxDepth = inputMaxDepth;
                        Console.WriteLine("Updated parsing depth to new value: " + inputMaxDepth);
                    }

                    option = null;
                }
            }

            try {
                processFiles();
            } catch (Exception ex) {
                Console.WriteLine("Error occurred: " + ex.Message);
                Console.WriteLine("Details: " + ex.StackTrace);
            }

            Console.WriteLine("Process completed. Preview image quality used: " + previewImgQuality);
            Console.Read();
        }

        static void processFiles() {

            rootDirPath = Directory.GetCurrentDirectory();
            if ("Debug".Equals(Path.GetFileName(rootDirPath))) {
                // traverse back to the root project directory out of the debug directory from where VS runs the exe
                rootDirPath = Directory.GetParent(rootDirPath).Parent.Parent.FullName + "/images";
            }
            Console.WriteLine("Searching in directory: " + rootDirPath);

            if (option == Option.List || option == Option.ListAndPrev) {
                output = File.CreateText(rootDirPath + "/" + OUTPUT_FILE_NAME);
                output.WriteLine("var imgData = [");
            }
            
            processDirs(rootDirPath, 0);

            if (option == Option.List || option == Option.ListAndPrev) {
                output.WriteLine("];");
                output.Flush();
                output.Dispose();
            }

            Console.WriteLine("Images listed: " + imgListCount);
            Console.WriteLine("Image previews generated: " + imgPrevGenCount);
            Console.WriteLine("Image previews deleted: " + imgPrevDelCount);
        }

        static void processDirs(string dirPath, int depth) {

            if (depth > maxDepth) {
                Console.WriteLine("WARNING: skipping sub-directory due to search depth limit: " + dirPath);
                return;
            }

            foreach (string filePath in Directory.GetFiles(dirPath)) {
                processFile(filePath);
            }

            foreach (string childDirPath in Directory.GetDirectories(dirPath)) {
                processDirs(childDirPath, depth + 1);
            }
        }

        static void processFile(string filePath) {

            switch (option) {
                case Option.ListAndPrev: { addToList(filePath); generatePreview(filePath, false); } break;
                case Option.List: { addToList(filePath); } break;
                case Option.DelPrev: { deletePreview(filePath); } break;
                case Option.RegenPrev: { generatePreview(filePath, true); } break;
            }
        }

        static void addToList(string filePath) {
            if (ImageUtil.isOriginalImg(filePath)) {
                output.WriteLine(formatLine(filePath));
                imgListCount++;
            }
        }

        static void deletePreview(string filePath) {
            if (ImageUtil.isPreviewImg(filePath)) {
                File.Delete(filePath);
                imgPrevDelCount++;
            }
        }

        private static void generatePreview(string filePath, bool overwrite) {

            if (!ImageUtil.isOriginalImg(filePath)) return;

            string previewFilePath = ImageUtil.getPreviewPath(filePath);

            if (overwrite || !File.Exists(previewFilePath)) {

                Console.WriteLine("Generating preview image: " + previewFilePath);

                Bitmap resizedImg = ImageUtil.ResizeImage(filePath, PREVIEW_WIDTH_PX);

                var encoderParameters = new EncoderParameters(1);
                var encoderParameter = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, previewImgQuality);
                encoderParameters.Param[0] = encoderParameter;
                resizedImg.Save(previewFilePath, ImageUtil.GetEncoderInfo("image/jpeg"), encoderParameters);
                resizedImg.Dispose();

                imgPrevGenCount++;
            }
        }

        static string formatLine(string imgPath) {

            // make relative to root path by removing it
            string outputPath = imgPath.Remove(0, rootDirPath.Count() + 1);

            // replace all \ with /
            outputPath = outputPath.Replace("\\", "/");

            DateTime? createdAt = null;

            try {
                createdAt = ImageUtil.GetDateTakenFromImage(imgPath);
            } catch (ArgumentException argE) {
                Console.Error.WriteLine("Image has no Date Taken date: " + imgPath);
            } catch (Exception e) {
                Console.Error.Write("Error reading image date taken from path " + imgPath + " : ");
                Console.Error.Write(e);
            }

            if (!createdAt.HasValue) {
                try {
                    createdAt = File.GetCreationTime(imgPath);
                } catch (Exception e) {
                    Console.Error.Write("Error reading image creation date from path " + imgPath + " : ");
                    Console.Error.Write(e);
                }
            }

            if (!createdAt.HasValue) {
                createdAt = DateTime.UtcNow;
            }

           return $@"
                    {{
                        thumb: '{ImageUtil.getPreviewPath(outputPath)}',
                        image: '{outputPath}',
                        title: '{Path.GetFileName(outputPath)}',
                        timestamp: '{ (long) createdAt.Value.Subtract(new DateTime(1970, 1, 1, 0, 0, 0)).TotalMilliseconds}',
                        creationDate: '{createdAt:G}'
                    }},";
        }
    }
}
