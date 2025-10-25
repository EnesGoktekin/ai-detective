import React, { useState } from 'react';
import { Button, Input, Card, Modal, Loading, Heading, Text } from '../components';

export const ComponentShowcase: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-dark-bg p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <Heading level={1} gold>Component Showcase</Heading>
          <Text variant="secondary" size="lg">
            Detective AI - UI Component Library
          </Text>
        </div>

        {/* Typography Section */}
        <Card>
          <Heading level={2} gold className="mb-6">Typography</Heading>
          <div className="space-y-4">
            <Heading level={1}>Heading 1</Heading>
            <Heading level={2}>Heading 2</Heading>
            <Heading level={3}>Heading 3</Heading>
            <Heading level={4}>Heading 4</Heading>
            <Heading level={5}>Heading 5</Heading>
            <Heading level={6}>Heading 6</Heading>
            <div className="pt-4 space-y-2">
              <Text variant="primary">Primary text color</Text>
              <Text variant="secondary">Secondary text color</Text>
              <Text variant="tertiary">Tertiary text color</Text>
              <Text variant="disabled">Disabled text color</Text>
            </div>
          </div>
        </Card>

        {/* Buttons Section */}
        <Card>
          <Heading level={2} gold className="mb-6">Buttons</Heading>
          <div className="space-y-6">
            <div>
              <Text variant="secondary" className="mb-3">Variants:</Text>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="ghost">Ghost Button</Button>
              </div>
            </div>
            
            <div>
              <Text variant="secondary" className="mb-3">Sizes:</Text>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
            
            <div>
              <Text variant="secondary" className="mb-3">States:</Text>
              <div className="flex flex-wrap gap-4">
                <Button disabled>Disabled</Button>
                <Button isLoading={isLoading} onClick={handleLoadingDemo}>
                  {isLoading ? 'Loading...' : 'Click to Load'}
                </Button>
              </div>
            </div>
            
            <div>
              <Text variant="secondary" className="mb-3">Full Width:</Text>
              <Button fullWidth>Full Width Button</Button>
            </div>
          </div>
        </Card>

        {/* Inputs Section */}
        <Card>
          <Heading level={2} gold className="mb-6">Inputs</Heading>
          <div className="space-y-6">
            <Input
              label="Username"
              placeholder="Enter your username"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              fullWidth
            />
            <Input
              label="Email"
              type="email"
              placeholder="your.email@example.com"
              fullWidth
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              fullWidth
            />
            <Input
              label="Error State"
              placeholder="This field has an error"
              error="This is an error message"
              fullWidth
            />
            <Input
              label="Disabled Input"
              placeholder="This is disabled"
              disabled
              fullWidth
            />
          </div>
        </Card>

        {/* Cards Section */}
        <div className="space-y-6">
          <Heading level={2} gold>Cards</Heading>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card padding="sm">
              <Heading level={4} className="mb-2">Small Padding</Heading>
              <Text variant="secondary">This card has small padding</Text>
            </Card>
            
            <Card padding="md">
              <Heading level={4} className="mb-2">Medium Padding</Heading>
              <Text variant="secondary">This card has medium padding</Text>
            </Card>
            
            <Card padding="lg">
              <Heading level={4} className="mb-2">Large Padding</Heading>
              <Text variant="secondary">This card has large padding</Text>
            </Card>
          </div>
          
          <Card hover>
            <Heading level={4} className="mb-2">Hoverable Card</Heading>
            <Text variant="secondary">
              Hover over this card to see the hover effect with gold border and shadow
            </Text>
          </Card>
        </div>

        {/* Modal Section */}
        <Card>
          <Heading level={2} gold className="mb-6">Modal</Heading>
          <Button onClick={() => setIsModalOpen(true)}>
            Open Modal
          </Button>
        </Card>

        {/* Loading Section */}
        <Card>
          <Heading level={2} gold className="mb-6">Loading Spinner</Heading>
          <div className="space-y-6">
            <div>
              <Text variant="secondary" className="mb-3">Sizes:</Text>
              <div className="flex items-center gap-8">
                <Loading size="sm" />
                <Loading size="md" />
                <Loading size="lg" />
              </div>
            </div>
            <div>
              <Text variant="secondary" className="mb-3">With Text:</Text>
              <Loading size="md" text="Loading data..." />
            </div>
          </div>
        </Card>

      </div>

      {/* Modal Example */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Example Modal"
        size="md"
      >
        <div className="space-y-4">
          <Text>
            This is an example modal with the Detective AI dark theme and gold accents.
          </Text>
          <Text variant="secondary">
            Press ESC or click the backdrop to close.
          </Text>
          <div className="flex gap-4 pt-4">
            <Button onClick={() => setIsModalOpen(false)} fullWidth>
              Close
            </Button>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} fullWidth>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
