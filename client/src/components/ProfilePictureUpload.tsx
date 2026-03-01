import { useState, useRef } from "react";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/utils/api";

interface ProfilePictureUploadProps {
  currentImage?: string;
  onImageUpdate: (imageUrl: string) => void;
  onImageRemove: () => void;
  size?: "sm" | "md" | "lg";
  showUploadButton?: boolean;
}

export function ProfilePictureUpload({
  currentImage,
  onImageUpdate,
  onImageRemove,
  size = "md",
  showUploadButton = true
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32"
  };

  const iconSizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG, PNG, GIF, or WebP image",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await api.post('/users/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const newImageUrl = response.data.data.profilePicture;
        onImageUpdate(newImageUrl);
        setPreviewUrl(null);
        
        toast({
          title: "Success",
          description: "Profile picture updated successfully"
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.response?.data?.message || "Failed to upload profile picture",
        variant: "destructive"
      });
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePicture = async () => {
    try {
      const response = await api.delete('/users/profile-picture');
      
      if (response.data.success) {
        onImageRemove();
        setPreviewUrl(null);
        
        toast({
          title: "Success",
          description: "Profile picture removed successfully"
        });
      }
    } catch (error: any) {
      console.error('Remove error:', error);
      toast({
        title: "Removal failed",
        description: error.response?.data?.message || "Failed to remove profile picture",
        variant: "destructive"
      });
    }
  };

  const displayImage = previewUrl || currentImage;

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative group">
        {/* Profile Picture */}
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-background shadow-lg transition-all duration-200 group-hover:shadow-xl`}>
          {displayImage ? (
            <img
              src={displayImage}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-muted flex items-center justify-center">
              <Camera className={`${iconSizeClasses[size]} text-muted-foreground`} />
            </div>
          )}
        </div>

        {/* Upload/Remove Overlay */}
        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          {displayImage ? (
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                title="Change picture"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={handleRemovePicture}
                className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                title="Remove picture"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-3 bg-white/90 rounded-full hover:bg-white transition-colors"
              title="Upload picture"
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Camera className="h-6 w-6" />
              )}
            </button>
          )}
        </div>

        {/* Loading Indicator */}
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-white/80 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Button (optional) */}
      {showUploadButton && !displayImage && (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload Picture
            </>
          )}
        </button>
      )}
    </div>
  );
}
