import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Info, Plus, X } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useMockBackend } from "@/services/mockBackend";
import { useToast } from "@/hooks/use-toast";

interface CreateEventFormProps {
  onSuccess?: (eventId: string) => void;
}

const CreateEventForm = ({ onSuccess }: CreateEventFormProps) => {
  const { isConnected, account } = useWallet();
  const { createEvent } = useMockBackend();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    votingDeadline: "",
    resolutionDeadline: "",
    options: ["", ""]
  });

  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    "Technology",
    "Crypto",
    "Politics",
    "Finance",
    "Health",
    "Space",
    "Sports",
    "Environment"
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Event title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (!formData.votingDeadline) {
      newErrors.votingDeadline = "Voting deadline is required";
    } else {
      const deadline = new Date(formData.votingDeadline);
      if (deadline <= new Date()) {
        newErrors.votingDeadline = "Voting deadline must be in the future";
      }
    }

    if (!formData.resolutionDeadline) {
      newErrors.resolutionDeadline = "Resolution deadline is required";
    } else {
      const resolutionDeadline = new Date(formData.resolutionDeadline);
      const votingDeadline = new Date(formData.votingDeadline);
      if (resolutionDeadline <= votingDeadline) {
        newErrors.resolutionDeadline = "Resolution deadline must be after voting deadline";
      }
    }

    const validOptions = formData.options.filter(option => option.trim());
    if (validOptions.length < 2) {
      newErrors.options = "At least 2 options are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to create an event",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsCreating(true);

    try {
      const validOptions = formData.options.filter(option => option.trim());

      const eventData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        votingDeadline: formData.votingDeadline,
        resolutionDeadline: formData.resolutionDeadline,
        options: validOptions,
        creator: account?.accountAddress.toString(),
        createdAt: new Date().toISOString()
      };

      const eventId = await createEvent(eventData);

      toast({
        title: "Event Created Successfully!",
        description: `Your event "${formData.title}" has been created and is now live.`,
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        votingDeadline: "",
        resolutionDeadline: "",
        options: ["", ""]
      });

      onSuccess?.(eventId);

    } catch (error) {
      console.error("Failed to create event:", error);
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, ""]
    }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  const setDefaultDeadlines = () => {
    const now = new Date();
    const votingDeadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
    const resolutionDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    setFormData(prev => ({
      ...prev,
      votingDeadline: votingDeadline.toISOString().slice(0, 16),
      resolutionDeadline: resolutionDeadline.toISOString().slice(0, 16)
    }));
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create New Event
        </CardTitle>
        <CardDescription>
          Create a prediction market event for the community to vote on
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!isConnected && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              You need to connect your wallet to create events.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Bitcoin will reach $100k by end of 2024"
                className="mt-1"
                disabled={!isConnected}
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide detailed information about this event..."
                className="mt-1"
                rows={3}
                disabled={!isConnected}
              />
              {errors.description && (
                <p className="text-sm text-destructive mt-1">{errors.description}</p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                disabled={!isConnected}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive mt-1">{errors.category}</p>
              )}
            </div>
          </div>

          {/* Deadlines */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" />
              <Label>Deadlines</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={setDefaultDeadlines}
                disabled={!isConnected}
              >
                Use Defaults
              </Button>
            </div>

            <div>
              <Label htmlFor="voting-deadline">Voting Deadline *</Label>
              <Input
                id="voting-deadline"
                type="datetime-local"
                value={formData.votingDeadline}
                onChange={(e) => setFormData(prev => ({ ...prev, votingDeadline: e.target.value }))}
                className="mt-1"
                disabled={!isConnected}
              />
              {errors.votingDeadline && (
                <p className="text-sm text-destructive mt-1">{errors.votingDeadline}</p>
              )}
            </div>

            <div>
              <Label htmlFor="resolution-deadline">Resolution Deadline *</Label>
              <Input
                id="resolution-deadline"
                type="datetime-local"
                value={formData.resolutionDeadline}
                onChange={(e) => setFormData(prev => ({ ...prev, resolutionDeadline: e.target.value }))}
                className="mt-1"
                disabled={!isConnected}
              />
              {errors.resolutionDeadline && (
                <p className="text-sm text-destructive mt-1">{errors.resolutionDeadline}</p>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Voting Options *</Label>
              <Badge variant="outline">{formData.options.filter(o => o.trim()).length} options</Badge>
            </div>

            <div className="space-y-2">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    disabled={!isConnected}
                  />
                  {formData.options.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeOption(index)}
                      disabled={!isConnected}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {errors.options && (
              <p className="text-sm text-destructive">{errors.options}</p>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={addOption}
              disabled={!isConnected}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Option
            </Button>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Event Creation Tips:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Make your event title clear and specific</li>
              <li>• Provide enough context for informed voting</li>
              <li>• Set realistic deadlines</li>
              <li>• Create clear, mutually exclusive options</li>
              <li>• Your event will be visible to all users once created</li>
            </ul>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!isConnected || isCreating}
          >
            {isCreating ? "Creating Event..." : "Create Event"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateEventForm;