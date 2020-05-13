// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"pt3V":[function(require,module,exports) {
module.exports = {
  "upstreamVersion": "0.2.20"
};
},{}],"QCba":[function(require,module,exports) {
"use strict";

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

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
  win32: 'sane-fmt-x86_64-pc-windows-gnu.exe'
};
const upstreamUrl = [upstreamUrlPrefix, upstream_version_json_1.upstreamVersion, upstreamBaseNames[process_1.platform]].join('/');

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

const getBooleanInput = name => parseBoolean(core_1.getInput(name), name);

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
  if (exportPath) core_1.addPath(location);
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
  if (actionLogs) args.push('--log-format=github-actions');
  const {
    error,
    status
  } = child_process_1.spawnSync(executablePath, args, {
    stdio: 'inherit'
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
},{"./upstream-version.json":"pt3V"}]},{},["QCba"], null)
//# sourceMappingURL=/index.js.map