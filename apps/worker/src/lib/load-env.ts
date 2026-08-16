import dotenv from "dotenv";

/** .env を優先して読み込む（シェルに残った古いキーで上書きされないようにする） */
dotenv.config({ override: true });
