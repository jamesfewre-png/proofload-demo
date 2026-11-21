# Third-party notices

TagRound's on-device voice notes use the open-source components below. Verified 16 November 2026 from the sources named.

## transformers.js (`@huggingface/transformers` 3.8.1)
- File: `vendor/transformers/transformers.min.js` (the package's `dist/transformers.min.js`, which bundles onnxruntime-web and `@huggingface/jinja`).
- Licence: Apache License 2.0. Source: `package.json` `"license": "Apache-2.0"` and the `LICENSE` file in the npm tarball (https://registry.npmjs.org/@huggingface/transformers/-/transformers-3.8.1.tgz). Full text: `vendor/transformers/LICENSE`.
- Copyright: author "Hugging Face" (package.json). The LICENSE file is the unfilled Apache boilerplate and carries no named copyright line.
- Project: https://github.com/huggingface/transformers.js

## ONNX Runtime Web (`onnxruntime-web` 1.22.0-dev.20250409-89f8206ba4)
- Files: `vendor/onnxruntime-web/ort-wasm-simd-threaded.jsep.mjs` and `.wasm`. Byte-identical (SHA-256 checked) to the copies shipped inside the transformers 3.8.1 tarball and in the pinned onnxruntime-web tarball (https://registry.npmjs.org/onnxruntime-web/-/onnxruntime-web-1.22.0-dev.20250409-89f8206ba4.tgz).
- Licence: MIT (`package.json` `"license": "MIT"`).
- Copyright: "Copyright (c) Microsoft Corporation. All rights reserved." (file headers in the package).
- Licence file: `vendor/onnxruntime-web/LICENSE` is the upstream file, fetched 2026-11-16 from https://raw.githubusercontent.com/microsoft/onnxruntime/main/LICENSE (MIT, "Copyright (c) Microsoft Corporation"; 1,073 bytes). The npm tarballs of onnxruntime-web and onnxruntime-common ship no LICENSE file, so it comes from the repository's main branch, not from the pinned release tag.
- Project: https://github.com/microsoft/onnxruntime

## OpenAI Whisper (model architecture, code and weights)
- Files: the model weights in `models/Xenova/whisper-base.en/onnx/` are a converted, 8-bit quantised export of `openai/whisper-base.en`.
- Licence per the Whisper repository: MIT. "Whisper's code and model weights are released under the MIT License." (README) and the `LICENSE` file, "Copyright (c) 2022 OpenAI". Sources: https://github.com/openai/whisper/blob/main/LICENSE and https://github.com/openai/whisper (README). Text: `vendor/WHISPER-LICENSE.txt`.
- Licence per the Hugging Face model card of the original weights: `license: apache-2.0` (https://huggingface.co/openai/whisper-base.en, card metadata and `https://huggingface.co/api/models/openai/whisper-base.en`).

## Xenova/whisper-base.en (ONNX conversion of the above)
- Files: `models/Xenova/whisper-base.en/*` (config, tokenizer and ONNX files). Model card: `models/Xenova/whisper-base.en/README.md`, from https://huggingface.co/Xenova/whisper-base.en.
- Licence per the model card metadata: `license: apache-2.0`, `base_model: openai/whisper-base.en` (also in https://huggingface.co/api/models/Xenova/whisper-base.en).

## Discrepancy to be aware of
The Whisper project states MIT for both code and weights (GitHub), while the Hugging Face cards for both `openai/whisper-base.en` and `Xenova/whisper-base.en` say Apache-2.0. Both are permissive licences that allow commercial use, redistribution and modification with the licence text and copyright notice retained, so the practical obligation is the same: ship the notices. This file records what each source says rather than choosing one. If a firm position is needed for sale, ask OpenAI or a lawyer; do not treat this note as legal advice.

## MIT License text (Whisper, "Copyright (c) 2022 OpenAI")
See `vendor/WHISPER-LICENSE.txt`.
