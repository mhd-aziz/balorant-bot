/**
 * Logger utility for consistent logging across the application
 */

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

class Logger {
    /**
     * Log info message
     * @param {string} message - Message to log
     */
    static info(message) {
        console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
    }

    /**
     * Log success message
     * @param {string} message - Message to log
     */
    static success(message) {
        console.log(`${colors.green}✅${colors.reset} ${message}`);
    }

    /**
     * Log warning message
     * @param {string} message - Message to log
     */
    static warn(message) {
        console.warn(`${colors.yellow}⚠${colors.reset} ${message}`);
    }

    /**
     * Log error message
     * @param {string} message - Message to log
     * @param {Error} [error] - Optional error object
     */
    static error(message, error = null) {
        console.error(`${colors.red}❌${colors.reset} ${message}`);
        if (error && error.stack) {
            console.error(`${colors.red}${error.stack}${colors.reset}`);
        }
    }

    /**
     * Log debug message
     * @param {string} message - Message to log
     */
    static debug(message) {
        console.log(`${colors.cyan}🔍${colors.reset} ${message}`);
    }
}

module.exports = Logger;
