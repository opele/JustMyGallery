using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.IO.Pipes;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace ImageFinder {

    /**
     * Outputs image paths to a text file relative to the root path of the application.
     * The paths are output in JSON array format, so it can be used in Javascript for scr attribute of img html elements.
     */
    class Program {

        private const string OUTPUT_FILE_NAME = "imageData.js";
        private const string TAGS_INPUT_FILE_NAME = "tags.txt";
        private static string[] CATEGORY_NAMES_TO_IGNORE = { "images", "img", "pics", "pictures" };
        private const int MAX_DEPTH = 4;
        public const int PREVIEW_WIDTH_PX = 230; // can not be changes because currently hardcoded in gallery html
        private const int PREVIEW_IMG_QUALITY = 75;

        enum Option {
            ListAndPrev,
            List,
            RegenPrev,
            DelPrev,
            SetQuality,
            SetMaxDepth,
            SetRootImgDirName,
            SetDirectoryNameCategoryIdentifierSuffix,
            SetConsiderParentDirectoriesForCategories,
            ToggleMinifyOutput,
        }

        static Dictionary<string, string> currentImgToTagsFromFile = new Dictionary<string, string>();
        static StreamWriter output;
        static int imgListCount;
        static int imgPrevGenCount;
        static int imgPrevDelCount;
        static string rootDirPath;
        static Option? option;
        static int previewImgQuality = -1;
        static int maxDepth = -1;
        static string rootImgDirName;
        static string directoryNameCategoryIdentifierSuffix;
        static bool considerParentDirectoriesForCategories;
        static bool minifyOutput;

        static void Main(string[] args) {

            option = null;
            imgListCount = 0;
            imgPrevGenCount = 0;
            imgPrevDelCount = 0;
            rootDirPath = null;
            rootImgDirName = null;
            output = null;
            directoryNameCategoryIdentifierSuffix = null;
            considerParentDirectoriesForCategories = false;
            minifyOutput = true;
            previewImgQuality = PREVIEW_IMG_QUALITY;
            maxDepth = MAX_DEPTH;

            Console.WriteLine("This program generates data about images for a gallery website. " +
                "It can generate preview images and a text file containing the list of images relative to the directory the app is started from. " +
                "Place it into the root directory representing your server file hierachy. " +
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
                Console.WriteLine("7. Set the optional directory name to search for image data ignoring all other directories placed on the same level as the executable (current value is " + rootImgDirName + ")");
                Console.WriteLine("8. Set a directory suffix to identify which identifies the directory name as a category for all images it contains (current value is " + directoryNameCategoryIdentifierSuffix + ")");
                Console.WriteLine("9. Set if all parent directories (up to app root) should be considered for categories (current value is " + considerParentDirectoriesForCategories + ")");
                Console.WriteLine("0. Toggle if the output file is minified (current value is " + minifyOutput + ")");

                switch (Console.ReadKey().Key) {
                    case ConsoleKey.D1: { option = Option.ListAndPrev; } break;
                    case ConsoleKey.D2: { option = Option.List; } break;
                    case ConsoleKey.D3: { option = Option.RegenPrev; } break;
                    case ConsoleKey.D4: { option = Option.DelPrev; } break;
                    case ConsoleKey.D5: { option = Option.SetQuality; }; break;
                    case ConsoleKey.D6: { option = Option.SetMaxDepth; }; break;
                    case ConsoleKey.D7: { option = Option.SetRootImgDirName; }; break;
                    case ConsoleKey.D8: { option = Option.SetDirectoryNameCategoryIdentifierSuffix; }; break;
                    case ConsoleKey.D9: { option = Option.SetConsiderParentDirectoriesForCategories; }; break;
                    case ConsoleKey.D0: { option = Option.ToggleMinifyOutput; }; break;
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
                    string input = Console.ReadLine();
                    bool success = int.TryParse(input, out int inputMaxDepth);

                    if (!success || inputMaxDepth < 0 || inputMaxDepth > 100) {
                        Console.WriteLine();
                        Console.WriteLine("The input '" + input + "' is not valid");
                    } else {
                        maxDepth = inputMaxDepth;
                        Console.WriteLine("Updated parsing depth to new value: " + inputMaxDepth);
                    }

                    option = null;
                }

                if (option == Option.SetRootImgDirName) {
                    Console.WriteLine("Type the name of the directory containing the images and confirm with return: ");
                    rootImgDirName = Console.ReadLine().Trim();

                    option = null;
                }

                if (option == Option.SetDirectoryNameCategoryIdentifierSuffix) {
                    Console.WriteLine("Type the name of the suffix a directiory must end with to be considered a category and confirm with return: ");
                    directoryNameCategoryIdentifierSuffix = Console.ReadLine().Trim();

                    option = null;
                }

                if (option == Option.SetConsiderParentDirectoriesForCategories) {
                    Console.WriteLine("Type 'true' if parent directories should be used as categories (otherwise defaults to false) and confirm with return: ");
                    if (bool.TryParse(Console.ReadLine().Trim(), out bool result)) {
                        considerParentDirectoriesForCategories = result;
                    }

                    option = null;
                }

                if (option == Option.ToggleMinifyOutput) {
                    minifyOutput = !minifyOutput;
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
                rootDirPath = Directory.GetParent(rootDirPath).Parent.Parent.FullName;
                rootImgDirName = "images";
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

            bool requiresImgDirCheck = depth == 0 && rootImgDirName != null && rootImgDirName.Length > 0;

            RefreshTagsFromFile(dirPath);

            foreach (string filePath in Directory.GetFiles(dirPath)) {
                if (!requiresImgDirCheck) processFile(filePath);
            }

            foreach (string childDirPath in Directory.GetDirectories(dirPath)) {
                if (!requiresImgDirCheck || childDirPath.EndsWith(rootImgDirName))
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

            DateTime createdAt = getCreationDate(imgPath);

            string tags = "";
            try {
                tags = ImageUtil.GetTagsFromImage(imgPath);
            } catch (Exception e) { };

            string tagsFromFile = "";
            try {
                tagsFromFile = GetTagsFromFile(imgPath);
            }
            catch (Exception e) { };

            if (tags == null || tags.Length == 0) {
                tags = tagsFromFile;
            } else if (tagsFromFile != null && tagsFromFile.Length > 0) {
                tags += "," + tagsFromFile;
            }

            string categories = "";
            try {
                categories = getCategories(outputPath);
            } catch (Exception e) { };

            Formatting format = minifyOutput ? Formatting.None : Formatting.Indented;

            var imgSize = ImageUtil.getImageSize(imgPath);
            var previewImgSize = ImageUtil.getImageSize(ImageUtil.getPreviewPath(imgPath));

            string line = JsonConvert.SerializeObject(new
            {
                thumb = ImageUtil.getPreviewPath(outputPath),
                image = outputPath,
                size = new { w = imgSize.Width, h = imgSize.Height },
                previewSize = new { w = previewImgSize.Width, h = previewImgSize.Height },
                title = Path.GetFileName(outputPath),
                timestamp = new DateTimeOffset(createdAt).ToUnixTimeMilliseconds(),
                createdDate = createdAt.ToString("G"),
                tags = tags ?? "",
                categories = categories
            }, format);

            return line + ",";
        }

        static string GetTagsFromFile(string imgPath) {
            string fileName = Path.GetFileName(imgPath);
            if (currentImgToTagsFromFile.ContainsKey(fileName)) {
                return currentImgToTagsFromFile[fileName];
            }
            return "";
        }
        

        static string getCategories(string imgPath) {

            string categories = "";
            string[] pathNames = imgPath.Split(Path.DirectorySeparatorChar);
            if (pathNames.Length == 1) {
                pathNames = imgPath.Split(Path.AltDirectorySeparatorChar);
            }

            for (int i = 0; i < pathNames.Length - 1; i++) {

                if (considerParentDirectoriesForCategories || pathNames.Length - 2 == i) {
                    string dirName = pathNames[i].ToLower();

                    if (CATEGORY_NAMES_TO_IGNORE.Contains(dirName)) continue;

                    if (directoryNameCategoryIdentifierSuffix == null || directoryNameCategoryIdentifierSuffix.Length == 0 || 
                        dirName.EndsWith(directoryNameCategoryIdentifierSuffix)) {

                        if (categories.Length > 0) categories += ",";

                        categories += dirName;
                    }
                }
            }

            return categories;
        }

        static DateTime getCreationDate(string imgPath) {
            DateTime? createdAt = null;

            try {
                createdAt = ImageUtil.GetDateTakenFromImage(imgPath);
            }
            catch (ArgumentException argE) {
                Console.Error.WriteLine("Image has no Date Taken date: " + imgPath);
            }
            catch (Exception e) {
                Console.Error.Write("Error reading image date taken from path " + imgPath + " : ");
                Console.Error.Write(e);
            }

            if (!createdAt.HasValue) {
                try {
                    createdAt = File.GetCreationTime(imgPath);
                }
                catch (Exception e) {
                    Console.Error.Write("Error reading image creation date from path " + imgPath + " : ");
                    Console.Error.Write(e);
                }
            }

            if (!createdAt.HasValue) {
                createdAt = DateTime.UtcNow;
            }

            return createdAt.Value;
        }

        static void RefreshTagsFromFile(string dirPath) {

            currentImgToTagsFromFile.Clear();

            string tagsFilePAth = dirPath + Path.DirectorySeparatorChar + TAGS_INPUT_FILE_NAME;

            if (File.Exists(tagsFilePAth)) {

                string tagsTxt = File.ReadAllText(tagsFilePAth);

                foreach (string line in tagsTxt.Split(Environment.NewLine.ToCharArray())) {

                    string[] imgNameToTags = line.Split(':');

                    if (imgNameToTags.Length == 2) {
                        currentImgToTagsFromFile.Add(imgNameToTags[0], imgNameToTags[1]);
                    }
                }
            }
        }
    }
}
