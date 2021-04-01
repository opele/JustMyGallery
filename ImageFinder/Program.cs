using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ImageFinder {

    /**
     * Outputs image paths to a text file relative to the root path of the application.
     * The paths are output in JSON array format, so it can be used in Javascript for scr attribute of img html elements.
     */
    class Program {

        private const string OUTPUT_FILE_NAME = "imagePaths.txt";
        private const int MAX_DEPTH = 4;
        private const int PREVIEW_WIDTH_PX = 230;
        private const int PREVIEW_HEIGHT_PX = 230;

        enum Option {
            ListAndPrev,
            List,
            RegenPrev,
            DelPrev
        }

        static StreamWriter output;
        static int imgListCount;
        static int imgPrevGenCount;
        static int imgPrevDelCount;
        static string rootDirPath;
        static Option? option;

        static void Main(string[] args) {

            option = null;
            imgListCount = 0;
            imgPrevGenCount = 0;
            imgPrevDelCount = 0;
            rootDirPath = null;
            output = null;

            while (option == null) {

                Console.WriteLine("Pick an action by typing the number: ");
                Console.WriteLine("1. Generate Image List and missing Preview Images");
                Console.WriteLine("2. Generate the Image List only");
                Console.WriteLine("3. Regenerate all Preview Images");
                Console.WriteLine("4. Delete all Preview Images");

                switch (Console.ReadKey().Key) {
                    case ConsoleKey.D1: { option = Option.ListAndPrev; } break;
                    case ConsoleKey.D2: { option = Option.List; } break;
                    case ConsoleKey.D3: { option = Option.RegenPrev; } break;
                    case ConsoleKey.D4: { option = Option.DelPrev; } break;
                }
            }

            try {
                processFiles();
            } catch (Exception ex) {
                Console.WriteLine("Error occurred: " + ex.Message);
            }

            Console.WriteLine("Process completed.");
            Console.Read();
        }

        static void processFiles() {

            rootDirPath = Directory.GetCurrentDirectory();
            Console.WriteLine("Searching in directory: " + rootDirPath);

            if (option == Option.List || option == Option.ListAndPrev) {
                output = File.CreateText(rootDirPath + "/" + OUTPUT_FILE_NAME);
                output.WriteLine("var imgPaths = [");
            }
            
            processDirs(rootDirPath, 0);

            if (option == Option.List || option == Option.ListAndPrev) {
                output.WriteLine("]");
                output.Flush();
                output.Dispose();
            }

            Console.WriteLine("Images listed: " + imgListCount);
            Console.WriteLine("Image previews generated: " + imgPrevGenCount);
            Console.WriteLine("Image previews deleted: " + imgPrevDelCount);
        }

        static void processDirs(string dirPath, int depth) {

            if (depth > MAX_DEPTH) {
                Console.WriteLine("WARNING: skipping sub-directory due to search depth limit: " + dirPath);
                return;
            }

            foreach (string filePath in Directory.GetFiles(dirPath)) {
                processFile(filePath, output);
            }

            foreach (string childDirPath in Directory.GetDirectories(dirPath)) {
                processDirs(childDirPath, depth + 1);
            }
        }

        static void processFile(string filePath, StreamWriter output) {

            switch (option) {
                case Option.ListAndPrev: { addToList(filePath); generatePreview(filePath, false); } break;
                case Option.List: { addToList(filePath); } break;
                case Option.DelPrev: { deletePreview(filePath); } break;
                case Option.RegenPrev: { generatePreview(filePath, true); } break;
            }
        }

        static void addToList(string filePath) {
            if (isOriginalImg(filePath)) {
                output.WriteLine(formatLine(filePath));
                imgListCount++;
            }
        }

        static void deletePreview(string filePath) {
            if (isPreviewImg(filePath)) {
                File.Delete(filePath);
                imgPrevDelCount++;
            }
        }

        private static void generatePreview(string filePath, bool overwrite) {

            if (!isOriginalImg(filePath)) return;

            string previewFilePath = getPreviewPath(filePath);

            if (overwrite || !File.Exists(previewFilePath)) {

                Console.WriteLine("Generating preview image: " + previewFilePath);

                Bitmap resizedImg = ImageUtil.ResizeImage(filePath, PREVIEW_WIDTH_PX, PREVIEW_HEIGHT_PX);

                resizedImg.Save(previewFilePath);
                resizedImg.Dispose();
                imgPrevGenCount++;
            }
        }

        static string getPreviewPath(string originalPath) {
            string extension = originalPath.Substring(originalPath.LastIndexOf("."));
            string prevImgPath = originalPath.Remove(originalPath.LastIndexOf(".")) + getPrieviewImageSuffix() + extension;
            return prevImgPath;
        }

        static bool isOriginalImg(string filePath) {
            return (filePath.EndsWith(".png") || filePath.EndsWith(".jpg") || filePath.EndsWith(".jpeg")) 
                && !isPreviewImg(filePath);
        }

        static bool isPreviewImg(string filePath) {
            string removedExtension = filePath.Remove(filePath.LastIndexOf("."));
            return removedExtension.EndsWith(getPrieviewImageSuffix());
        }

        static string getPrieviewImageSuffix() {
            return "Preview" + PREVIEW_WIDTH_PX + "px";
        }

        static string formatLine(string imgPath) {
            
            // make relative to root path by removing it
            string outputLine = imgPath.Remove(0, rootDirPath.Count() + 1);

            // replace all \ with /
            outputLine = outputLine.Replace("\\", "/");

            // json array format
            outputLine = "\"" + outputLine + "\",";

            return outputLine;
        }
    }
}
