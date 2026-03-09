# Contributing to Cerebro

Thank you for your interest in contributing to Cerebro! We welcome contributions from the community to help make this Zero-Knowledge JWT proving service even better.

## Ways to Contribute

1.  **Reporting Bugs:** Use the GitHub Issue Tracker to report bugs. Please use the "Bug Report" template.
2.  **Requesting Features:** Use the Issue Tracker to suggest new features or improvements.
3.  **Submitting Pull Requests:** We welcome PRs for bug fixes, performance improvements, and new features listed in the Roadmap.

## Local Development Setup

### Prerequisites

- Node.js (v18+)
- Scarb (for Cairo contracts)
- Snarkjs (globally installed is recommended: `npm install -g snarkjs`)
- Rapidsnark (optional but recommended for performance)

### Setup

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/cerebro.git
    cd cerebro
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```

### Building Contracts

Navigate to the `contracts` directory and use Scarb:
```bash
cd contracts
scarb build
```

## Pull Request Process

1.  **Fork the repo** and create your branch from `main`.
2.  **Describe your changes** clearly in the PR description.
3.  **Run tests** (if applicable) and ensure your code follows the existing style.
4.  **Update documentation** if you are changing APIs or adding new features.
5.  **Be patient**—maintainers will review your PR as soon as possible.

## Code of Conduct

By participating in this project, you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).
