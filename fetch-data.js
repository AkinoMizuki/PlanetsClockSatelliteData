import fs from 'node:fs/promises';
import yaml from 'js-yaml';
import * as core from '@actions/core';

const PAGES_DIRECTORY_PATH = './_site/';

async function fetchJsonArray(url) {
	const response = await fetch(url);
	const responseText = await response.text();

	if (!response.ok) {
		core.error(`${url} の取得に失敗しました。HTTP ${response.status}: ${responseText}`);
		return [];
	}

	let parsed;
	try {
		parsed = JSON.parse(responseText);
	} catch (error) {
		core.error(`${url} からJSONではないデータが返りました: ${responseText}`);
		return [];
	}

	if (!Array.isArray(parsed)) {
		core.error(`${url} から配列JSONではないデータが返りました: ${responseText}`);
		return [];
	}

	return parsed;
}

const yamlUrl = new URL('satellites.yaml', import.meta.url);
const urls = yaml.load(await fs.readFile(yamlUrl, { encoding: 'utf-8' }));

if (!Array.isArray(urls)) {
	throw new Error('satellites.yaml がURL配列ではありません。');
}

const data = [];

for (const url of urls) {
	const items = await fetchJsonArray(url);
	data.push(...items);
}

const pagesDirectory = new URL(PAGES_DIRECTORY_PATH, import.meta.url);
await fs.mkdir(pagesDirectory, { recursive: true });

await fs.writeFile(
	new URL('satellites.txt', pagesDirectory),
	JSON.stringify(data)
);

core.info(`satellites.txt を出力しました。衛星数: ${data.length}`);
