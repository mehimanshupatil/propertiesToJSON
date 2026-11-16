import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

/**
 * Reference converter for test/java-compat.test.ts.
 *
 * Usage: java test/java/PropertiesToJson.java <file-or-dir>...
 * Loads each .properties file (directories are expanded, sorted by name) with
 * java.util.Properties.load and prints a JSON array with one entry per file:
 * {"file": ..., "result": {...}} or {"file": ..., "error": "..."}.
 */
public class PropertiesToJson {
    public static void main(String[] args) throws IOException {
        List<Path> files = new ArrayList<>();
        for (String arg : args) {
            Path p = Paths.get(arg);
            if (Files.isDirectory(p)) {
                try (DirectoryStream<Path> ds = Files.newDirectoryStream(p, "*.properties")) {
                    List<Path> inDir = new ArrayList<>();
                    ds.forEach(inDir::add);
                    Collections.sort(inDir);
                    files.addAll(inDir);
                }
            } else {
                files.add(p);
            }
        }

        StringBuilder out = new StringBuilder("[");
        for (Path file : files) {
            if (out.length() > 1) out.append(",\n");
            out.append("{\"file\":").append(quote(file.toString())).append(",");
            Properties props = new Properties();
            try (Reader r = Files.newBufferedReader(file, StandardCharsets.UTF_8)) {
                props.load(r);
                out.append("\"result\":{");
                boolean first = true;
                for (String key : new TreeSet<>(props.stringPropertyNames())) {
                    if (!first) out.append(",");
                    first = false;
                    out.append(quote(key)).append(":").append(quote(props.getProperty(key)));
                }
                out.append("}}");
            } catch (IllegalArgumentException e) {
                out.append("\"error\":").append(quote(e.getMessage())).append("}");
            }
        }
        out.append("]");

        PrintStream stdout = new PrintStream(new FileOutputStream(FileDescriptor.out), true, StandardCharsets.UTF_8);
        stdout.println(out);
    }

    private static String quote(String s) {
        StringBuilder b = new StringBuilder("\"");
        for (char c : s.toCharArray()) {
            if (c == '"' || c == '\\') b.append('\\').append(c);
            else if (c < 0x20) b.append(String.format("\\u%04x", (int) c));
            else b.append(c);
        }
        return b.append('"').toString();
    }
}
