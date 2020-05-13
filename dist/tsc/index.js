"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const process_1 = require("process");
const core_1 = require("@actions/core");
const js_yaml_1 = require("js-yaml");
const node_fetch_1 = __importDefault(require("node-fetch"));
const unique_temp_path_1 = __importDefault(require("unique-temp-path"));
const upstream_version_json_1 = require("./upstream-version.json");
const location = unique_temp_path_1.default('sane-fmt.');
const executableBaseName = process_1.platform === 'win32' ? 'sane-fmt.exe' : 'sane-fmt';
const executablePath = path_1.default.join(location, executableBaseName);
const upstreamUrlPrefix = 'https://github.com/KSXGitHub/sane-fmt/releases/download';
const upstreamBaseNames = {
    darwin: 'sane-fmt-x86_64-apple-darwin',
    linux: 'sane-fmt-x86_64-unknown-linux-gnu',
    win32: 'sane-fmt-x86_64-pc-windows-gnu.exe',
};
const upstreamUrl = [
    upstreamUrlPrefix,
    upstream_version_json_1.upstreamVersion,
    upstreamBaseNames[process_1.platform],
].join('/');
function parseBoolean(value, inputName) {
    switch (value.toLowerCase()) {
        case 'true':
            return true;
        case 'false':
            return false;
        default:
            core_1.setFailed(`Input "${inputName}" is not a boolean: "${value}"`);
            throw process_1.exit(1);
    }
}
const getBooleanInput = (name) => parseBoolean(core_1.getInput(name), name);
async function main() {
    const args = js_yaml_1.safeLoad(core_1.getInput('args'));
    const actionLogs = getBooleanInput('action-logs');
    const exportPath = getBooleanInput('export-path');
    if (!Array.isArray(args)) {
        core_1.setFailed(new TypeError(`Input "args" is not an array: ${JSON.stringify(args)}`));
        return;
    }
    core_1.setOutput('location', location);
    core_1.setOutput('executable-basename', executableBaseName);
    core_1.setOutput('executable-path', executablePath);
    if (exportPath)
        core_1.addPath(location);
    await core_1.group('Installing sane-fmt', async () => {
        console.log(`Creating directory ${location}`);
        fs_1.default.mkdirSync(location);
        console.log(`Downloading ${upstreamUrl} into ${executablePath}`);
        const writer = fs_1.default.createWriteStream(executablePath);
        const response = await node_fetch_1.default(upstreamUrl);
        response.body.pipe(writer);
        await new Promise((resolve, reject) => {
            writer.once('error', reject);
            writer.once('close', resolve);
        });
        console.log(`Making ${executablePath} executable`);
        fs_1.default.chmodSync(executablePath, 0o755);
    });
    if (actionLogs)
        args.push('--log-format=github-actions');
    const { error, status } = child_process_1.spawnSync(executablePath, args, {
        stdio: 'inherit',
    });
    if (error) {
        core_1.setFailed(error);
        return;
    }
    if (status) {
        throw process_1.exit(status);
    }
}
main().catch(core_1.setFailed);
//# sourceMappingURL=index.js.map