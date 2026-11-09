import type { Meta, StoryObj } from '@storybook/vue3-vite';
import SoarAwesomeReference from './SoarAwesomeReference.storybook.vue';
import data from './SoarAwesomeReference.data.json';

const meta = {
  title: 'Molecules/SoarAwesomeReference',
  component: SoarAwesomeReference,
  // Remove '!dev' if it should appear in the sidebar during `storybook dev`.
  tags: ['autodocs', '!dev'],
  argTypes: {
    label: { control: 'text', description: 'Badge text.' },
    title: { control: 'text', description: 'Dialog title.' },
    message: { control: 'text', description: 'Dialog body text.' },
  },
  args: data,
} satisfies Meta<typeof SoarAwesomeReference>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomText: Story = {
  args: { label: 'Beta', title: 'Beta component', message: 'This component may change before its stable release.' },
};
