import { Helmet } from 'react-helmet-async';
import { useMemo, useState, useRef } from 'react';
import { Upload, Plus, Trash2, Save, Move, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useStore, FieldMapping } from '@/store/useStore';
import { validateTemplateMapping } from '@/utils/customTemplatePDF';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';

const fieldTypes = [
  { value: 'businessName', label: 'Business Name' },
  { value: 'clientName', label: 'Client Name' },
  { value: 'invoiceNumber', label: 'Invoice Number' },
  { value: 'date', label: 'Invoice Date' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'items', label: 'Items Table' },
  { value: 'subtotal', label: 'Subtotal' },
  { value: 'tax', label: 'Tax' },
  { value: 'total', label: 'Total' },
  { value: 'notes', label: 'Notes' },
  { value: 'logo', label: 'Logo' },
];

export default function TemplateEditor() {
  const { customTemplates, addCustomTemplate, deleteCustomTemplate } = useStore();
  const [templateName, setTemplateName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldMapping[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackgroundImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addField = (type: FieldMapping['fieldType']) => {
    const newField: FieldMapping = {
      fieldId: uuidv4(),
      fieldType: type,
      x: 50,
      y: 50,
      width: type === 'items' ? 400 : 150,
      height: type === 'items' ? 200 : 30,
      fontSize: 12,
      fontWeight: 'normal',
      color: '#000000',
    };
    setFields([...fields, newField]);
    setSelectedField(newField.fieldId);
  };

  const updateField = (fieldId: string, updates: Partial<FieldMapping>) => {
    setFields(fields.map(f => 
      f.fieldId === fieldId ? { ...f, ...updates } : f
    ));
  };

  const removeField = (fieldId: string) => {
    setFields(fields.filter(f => f.fieldId !== fieldId));
    if (selectedField === fieldId) setSelectedField(null);
  };

  const handleMouseDown = (e: React.MouseEvent, fieldId: string) => {
    e.preventDefault();
    setSelectedField(fieldId);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedField || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    updateField(selectedField, { x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const validation = useMemo(
    () =>
      validateTemplateMapping({
        name: templateName,
        backgroundImage: backgroundImage ?? '',
        fieldMappings: fields,
      }),
    [templateName, backgroundImage, fields],
  );

  const saveTemplate = () => {
    if (!templateName) {
      toast.error('Please enter a template name');
      return;
    }
    if (!backgroundImage) {
      toast.error('Please upload a background image');
      return;
    }
    if (fields.length === 0) {
      toast.error('Please add at least one field');
      return;
    }

    if (!validation.ok) {
      toast.error('Mapping is incomplete. Fix the issues before saving.', {
        description: validation.issues[0],
      });
      return;
    }

    addCustomTemplate({
      name: templateName,
      backgroundImage,
      fieldMappings: fields,
    });

    toast.success('Template saved successfully');
    setTemplateName('');
    setBackgroundImage(null);
    setFields([]);
  };

  const getFieldLabel = (type: string) => {
    return fieldTypes.find(f => f.value === type)?.label || type;
  };

  return (
    <>
      <Helmet>
        <title>Templates | InvoicePro</title>
        <meta name="description" content="Design and customize invoice templates with our drag-and-drop template editor in InvoicePro." />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Templates | InvoicePro" />
        <meta property="og:description" content="Design and customize invoice templates with our drag-and-drop template editor in InvoicePro." />
        <meta property="og:url" content="https://invoicepro31.lovable.app/templates" />
        <link rel="canonical" href="https://invoicepro31.lovable.app/templates" />
      </Helmet>
      <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Template Editor"
        description="Create custom invoice templates by uploading your design and mapping fields"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Template Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="My Custom Template"
                />
              </div>

              <div className="space-y-2">
                <Label>Background Image</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="template-upload"
                  />
                  <Button variant="outline" className="w-full" asChild>
                    <label htmlFor="template-upload" className="cursor-pointer flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      {backgroundImage ? 'Change Image' : 'Upload Image'}
                    </label>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Add Fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {fieldTypes.map(type => (
                <Button
                  key={type.value}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => addField(type.value as FieldMapping['fieldType'])}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {type.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          {selectedField && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base">Field Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const field = fields.find(f => f.fieldId === selectedField);
                  if (!field) return null;
                  return (
                    <>
                      <p className="font-medium text-sm">{getFieldLabel(field.fieldType)}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Width</Label>
                          <Input
                            type="number"
                            value={field.width}
                            onChange={(e) => updateField(field.fieldId, { width: parseInt(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Height</Label>
                          <Input
                            type="number"
                            value={field.height}
                            onChange={(e) => updateField(field.fieldId, { height: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Font Size</Label>
                          <Input
                            type="number"
                            value={field.fontSize}
                            onChange={(e) => updateField(field.fieldId, { fontSize: parseInt(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Color</Label>
                          <Input
                            type="color"
                            value={field.color}
                            onChange={(e) => updateField(field.fieldId, { color: e.target.value })}
                          />
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => removeField(field.fieldId)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Field
                      </Button>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {!validation.ok && fields.length > 0 && (
            <Alert variant="destructive" data-testid="template-mapping-errors">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Mapping is incomplete</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4 mt-2 space-y-1 text-xs">
                  {validation.issues.slice(0, 5).map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={saveTemplate}
            className="w-full"
            disabled={!validation.ok || !templateName || !backgroundImage}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Template
          </Button>
        </div>

        <div className="lg:col-span-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Move className="w-4 h-4" />
                Template Canvas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                ref={canvasRef}
                className={cn(
                  "relative border-2 border-dashed rounded-lg overflow-hidden",
                  backgroundImage ? "border-transparent" : "border-border"
                )}
                style={{ 
                  width: '100%',
                  height: 600,
                  background: backgroundImage ? `url(${backgroundImage}) center/contain no-repeat` : undefined,
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {!backgroundImage && (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Upload a template image to get started</p>
                    </div>
                  </div>
                )}

                {fields.map(field => (
                  <div
                    key={field.fieldId}
                    className={cn(
                      "absolute border-2 rounded cursor-move flex items-center justify-center text-xs font-medium transition-colors",
                      selectedField === field.fieldId
                        ? "border-primary bg-primary/20"
                        : "border-blue-400 bg-blue-400/20 hover:border-primary"
                    )}
                    style={{
                      left: field.x,
                      top: field.y,
                      width: field.width,
                      height: field.height,
                      fontSize: field.fontSize,
                      color: field.color,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, field.fieldId)}
                  >
                    {getFieldLabel(field.fieldType)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {customTemplates.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Your Custom Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {customTemplates.map(template => (
                <div
                  key={template.id}
                  className="relative group border rounded-lg overflow-hidden"
                >
                  <img
                    src={template.backgroundImage}
                    alt={template.name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-white text-sm font-medium truncate">{template.name}</p>
                    <p className="text-white/70 text-xs">{template.fieldMappings.length} fields</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      deleteCustomTemplate(template.id);
                      toast.success('Template deleted');
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
