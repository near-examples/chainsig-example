import React from "react";
import * as Select from "@radix-ui/react-select";
import classnames from "classnames";
import {
	CheckIcon,
	ChevronDownIcon,
	ChevronUpIcon,
} from "@radix-ui/react-icons";

// Define the props for SelectItem
interface SelectItemProps extends React.ComponentProps<typeof Select.Item> {
	className?: string;
	children: React.ReactNode;
}

const SelectItem = React.forwardRef(
	(
		{ children, className, ...props }: SelectItemProps,
		forwardedRef: React.ForwardedRef<HTMLDivElement>
	) => {
		return (
			<Select.Item
				className={classnames(
					"relative flex h-[25px] cursor-pointer hover:bg-slate-400 select-none items-center rounded-[3px] pl-[25px] pr-[35px] text-[13px] leading-none text-violet11 data-[disabled]:pointer-events-none data-[highlighted]:bg-violet9 data-[disabled]:text-mauve8 data-[highlighted]:text-violet1 data-[highlighted]:outline-none",
					className
				)}
				{...props}
				ref={forwardedRef}
			>
				<Select.ItemText>{children}</Select.ItemText>
				<Select.ItemIndicator className="absolute left-0 inline-flex w-[25px] items-center justify-center">
					<CheckIcon />
				</Select.ItemIndicator>
			</Select.Item>
		);
	}
);

// Assign displayName for better debugging in React DevTools
SelectItem.displayName = "SelectItem";

interface SelectorProps {
  onValueChange: (value: string) => void;
}
const Selector: React.FC<SelectorProps> = ({ onValueChange }) => (
	<Select.Root onValueChange={(value) => onValueChange(value)}>
		<Select.Trigger
			className="inline-flex h-[35px] items-center justify-start gap-[5px] rounded bg-slate-700 text-white px-[15px] leading-none text-violet11 shadow-[0_2px_10px] shadow-black/10 outline-none hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-violet9 border"
			aria-label="Food"
		>
			<Select.Value placeholder="Segwit" />
			<Select.Icon className="text-violet11">
				<ChevronDownIcon />
			</Select.Icon>
		</Select.Trigger>
		<Select.Portal>
			<Select.Content className="overflow-hidden rounded-md bg-white shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)]">
				<Select.ScrollUpButton className="flex h-[25px] cursor-default items-center justify-center bg-white text-violet11">
					<ChevronUpIcon />
				</Select.ScrollUpButton>
				<Select.Viewport className="p-[5px]">
					<Select.Group>
						<SelectItem value="legacy">Legacy P2PKH</SelectItem>
						<SelectItem value="segwit">Segwit</SelectItem>
					</Select.Group>
				</Select.Viewport>
				<Select.ScrollDownButton className="flex h-[25px] cursor-default items-center justify-center bg-white text-violet11">
					<ChevronDownIcon />
				</Select.ScrollDownButton>
			</Select.Content>
		</Select.Portal>
	</Select.Root>
);

export default Selector;
