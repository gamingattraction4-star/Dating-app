import java.sql.*;

public class TestDB {
    public static void main(String[] args) throws Exception {
        // Try multiple connection variants
        String[][] configs = {
            {"jdbc:mysql://127.0.0.1:3306/sparkmatch?useSSL=false&allowPublicKeyRetrieval=true", "root", "rootpassword"},
            {"jdbc:mysql://localhost:3306/sparkmatch?useSSL=false&allowPublicKeyRetrieval=true", "root", "rootpassword"},
            {"jdbc:mysql://127.0.0.1:3306/sparkmatch?useSSL=false&allowPublicKeyRetrieval=true", "sparkmatch", "sparkmatch123"},
            {"jdbc:mysql://localhost:3306/sparkmatch?useSSL=false&allowPublicKeyRetrieval=true", "sparkmatch", "sparkmatch123"},
        };

        for (String[] c : configs) {
            System.out.print("Testing " + c[1] + "@" + (c[0].contains("127.0.0.1") ? "127.0.0.1" : "localhost") + " ... ");
            try {
                Connection conn = DriverManager.getConnection(c[0], c[1], c[2]);
                System.out.println("SUCCESS! v" + conn.getMetaData().getDatabaseProductVersion());
                conn.close();
            } catch (Exception e) {
                System.out.println("FAILED: " + e.getMessage());
            }
        }
    }
}
