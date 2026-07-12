import { Container, getKeybindings, Spacer, Text } from "@earendil-works/pi-tui";
import { theme } from "../theme/theme.ts";
import { DynamicBorder } from "./dynamic-border.ts";
import { keyHint, rawKeyHint } from "./keybinding-hints.ts";

export interface ExtensionToggleItem {
	path: string;
	resolvedPath: string;
	enabled: boolean;
}

const MAX_VISIBLE_ITEMS = 10;

export class ExtensionToggleSelectorComponent extends Container {
	private readonly items: ExtensionToggleItem[];
	private readonly enabled: Set<string>;
	private readonly listContainer = new Container();
	private readonly onApply: (enabled: ReadonlySet<string>) => void;
	private readonly onCancel: () => void;
	private selectedIndex = 0;

	constructor(items: ExtensionToggleItem[], onApply: (enabled: ReadonlySet<string>) => void, onCancel: () => void) {
		super();
		this.items = items;
		this.enabled = new Set(items.filter((item) => item.enabled).map((item) => item.resolvedPath));
		this.onApply = onApply;
		this.onCancel = onCancel;

		this.addChild(new DynamicBorder());
		this.addChild(new Spacer(1));
		this.addChild(new Text(theme.bold(theme.fg("accent", "Extensions")), 1, 0));
		this.addChild(new Text(theme.fg("muted", "Enable or disable extensions for this process."), 1, 0));
		this.addChild(new Spacer(1));
		this.addChild(this.listContainer);
		this.addChild(new Spacer(1));
		this.addChild(
			new Text(
				rawKeyHint("↑↓", "navigate") +
					"  " +
					keyHint("tui.select.confirm", "toggle/apply") +
					"  " +
					keyHint("tui.select.cancel", "cancel"),
				1,
				0,
			),
		);
		this.addChild(new Spacer(1));
		this.addChild(new DynamicBorder());
		this.updateList();
	}

	private updateList(): void {
		this.listContainer.clear();
		const rowCount = this.items.length + 1;
		const start = Math.min(
			Math.max(0, this.selectedIndex - MAX_VISIBLE_ITEMS + 1),
			Math.max(0, rowCount - MAX_VISIBLE_ITEMS),
		);
		const end = Math.min(rowCount, start + MAX_VISIBLE_ITEMS);

		for (let index = start; index < end; index++) {
			const selected = index === this.selectedIndex;
			const prefix = selected ? theme.fg("accent", "→ ") : "  ";
			if (index === this.items.length) {
				const label = theme.bold("Apply changes");
				this.listContainer.addChild(new Text(prefix + theme.fg(selected ? "accent" : "text", label), 1, 0));
				continue;
			}

			const item = this.items[index];
			const checked = this.enabled.has(item.resolvedPath) ? "[x]" : "[ ]";
			this.listContainer.addChild(
				new Text(prefix + theme.fg(selected ? "accent" : "text", `${checked} ${item.path}`), 1, 0),
			);
		}
	}

	handleInput(keyData: string): void {
		const keybindings = getKeybindings();
		if (keybindings.matches(keyData, "tui.select.up")) {
			this.selectedIndex = Math.max(0, this.selectedIndex - 1);
			this.updateList();
		} else if (keybindings.matches(keyData, "tui.select.down")) {
			this.selectedIndex = Math.min(this.items.length, this.selectedIndex + 1);
			this.updateList();
		} else if (keybindings.matches(keyData, "tui.select.confirm")) {
			if (this.selectedIndex === this.items.length) {
				this.onApply(new Set(this.enabled));
				return;
			}
			const resolvedPath = this.items[this.selectedIndex]?.resolvedPath;
			if (resolvedPath) {
				if (this.enabled.has(resolvedPath)) this.enabled.delete(resolvedPath);
				else this.enabled.add(resolvedPath);
				this.updateList();
			}
		} else if (keybindings.matches(keyData, "tui.select.cancel")) {
			this.onCancel();
		}
	}
}
