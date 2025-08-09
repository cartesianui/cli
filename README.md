# CartesianUI CLI

A custom command-line tool for scaffolding and managing **Cartesian UI** projects.

---

## Requirements

| Tool       | Version Tested | Notes                                      |
|------------|---------------|--------------------------------------------|
| Node.js    | 18.12.0        | Recommended (LTS). Other versions may work |
| npm        | 9.x+           | Ships with Node.js                         |
| TypeScript | 5.0.0+         | Required for development only              |

---

## Dependencies

| Dependency          | Version     | Purpose                                             |
|---------------------|-------------|-----------------------------------------------------|
| fs-extra            | ^11.0.0     | File system utilities with promises                 |
| @types/fs-extra     | ^11.0.4     | Type definitions for fs-extra (dev only)            |
| @types/node         | ^18.17.0    | Node.js type definitions (dev only)                 |
| typescript          | ^5.0.0      | TypeScript compiler (dev only)                      |
| undici-types        | ^7.13.0     | Required by some newer Node.js type definitions     |

---

## Quickstart

## ⚙️ Install (Development)

Clone the repository:

```bash
git clone https://github.com/cartesianui/cli.git
cd cli
npm install
```

## 🧪 Test the CLI Locally
```bash
npm run build
npm link
```
> Now you can use `cui` command for local testing

## 🚀 Build (Production)
Compile TypeScript to JavaScript:
```bash
npm run build
```

## 📦 Publish
```bash
npm publish --access public
```

## Install from npm (published version)
```bash
npm install -g @cartesianui/cli
```

# 📝 Notes

## Template Files
- The CLI copies template files from the `template/` directory in the CLI package into the destination folder.
- The `stub` folder is **skipped** by default.

## Confirmation Prompt
- When running commands that will overwrite files, the CLI will ask for confirmation.
- Use the `--yes` flag to skip the confirmation prompt.

---

## License
**Disclaimer:**  
This software is provided **"as is"**, without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and noninfringement.  
Use it at your own risk.  
We are not responsible for any damages, data loss, or other consequences resulting from its use.


