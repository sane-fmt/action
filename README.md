# sane-fmt Action

Use [sane-fmt](https://github.com/KSXGitHub/sane-fmt) to check for TypeScript/JavaScript code formatting.

## Usage Examples

### The most simple usage

This will check format of all TypeScript and JavaScript files, excluding `.git` and `node_modules`.

```yaml
on: push
jobs:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
    - uses: sane-fmt/action@master
```

### Disable Action Logs

This will do the same as [before](#the-most-simple-usage) but without log grouping and annotations.

```yaml
on: push
jobs:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
    - uses: sane-fmt/action@master
      with:
        actions-logs: 'false'
```

### Check only some files

To check only some files, you must customize `args` input.

**NOTE:** Due to limitation of inputs in GitHub Actions, value of `args` must be a YAML string representation of an array, not an actual array.

```yaml
on: push
jobs:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
    - uses: sane-fmt/action@master
      with:
        args: |
          - --details=diff
          - --color=always
          - foo.ts
          - bar.ts
          - my-directory
```

### Do not run, only install

You can also choose not to run `sane-fmt` immediately, but instead, add it to PATH.

```yaml
on: push
jobs:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2

    - name: Install sane-fmt
      uses: sane-fmt/action@master
      with:
        run: 'false'
        export-path: 'true'

    - name: Run sane-fmt
      run: sane-fmt --details=diff --log-format=github-actions ./
```

## Inputs and Outputs

### Inputs

|     name    |                                   description                                  |   type   |              default             |
|:-----------:|:------------------------------------------------------------------------------:|:--------:|:--------------------------------:|
| run         | Whether sane-fmt should be executed right away                                 | boolean  | true                             |
| args        | List of CLI arguments to pass to sane-fmt                                      | string[] | [--details=diff, --color=always] |
| action-logs | Whether to pass `--log-format=github-actions` to integrate with GitHub Actions | boolean  | true                             |
| export-path | Whether to add sane-fmt to PATH                                                | boolean  | false                            |

### Outputs

**NOTE:** `total`, `changed`, and `unchanged` are available only if `inputs#run` and `inputs#action-logs` are `true`.

|         name        |                         description                         |  type  |
|:-------------------:|:-----------------------------------------------------------:|:------:|
| location            | Directory where sane-fmt is stored                          | string |
| executable-basename | Base name of sane-fmt (either `sane-fmt` or `sane-fmt.exe`) | string |
| executable-path     | Full path to sane-fmt                                       | string |
| total               | Number of scanned files                                     | number |
| changed             | Number of scanned files that aren't formatted               | number |
| unchanged           | Number of scanned files that are formatted                  | number |

## Become a Patron

[My Patreon Page](https://patreon.com/khai96_).

## License

[MIT](https://git.io/Jf8hr) © [Hoàng Văn Khải](https://ksxgithub.github.io/)
