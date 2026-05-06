const format = (level, msg, meta) => {
  const ts = new Date().toISOString();
  const extra = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `[${ts}] [${level}] ${msg}${extra}`;
};

const simpleLogger = {
  info(msg, meta) {
    console.log(format("INFO", msg, meta));
  },
  warn(msg, meta) {
    console.warn(format("WARN", msg, meta));
  },
  error(msg, meta) {
    console.error(format("ERROR", msg, meta));
  },
  debug(msg, meta) {
    console.debug(format("DEBUG", msg, meta));
  },
};

module.exports = simpleLogger;
