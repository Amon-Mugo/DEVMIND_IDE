let db = null;

export const initDB = async () => {
  const SQL = await import("sql.js");
  const sqlPromise = SQL.default({
    locateFile: () => "/sql-wasm.wasm",
  });
  const sqlJs = await sqlPromise;
  db = new sqlJs.Database();
  return db;
};

export const runQuery = (query) => {
  if (!db) throw new Error("Database not initialized");
  try {
    const results = db.exec(query);
    if (!results.length)
      return {
        columns: [],
        rows: [],
        message: "Query executed successfully",
      };
    return {
      columns: results[0].columns,
      rows: results[0].values,
      message: `${results[0].values.length} row(s) returned`,
    };
  } catch (err) {
    throw new Error(err.message);
  }
};