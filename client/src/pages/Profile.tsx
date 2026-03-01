import { useState, useEffect } from "react";
import { User, Mail, Calendar, Shield, Edit2, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ProfilePictureUpload } from "@/components/ProfilePictureUpload";
import api from "@/utils/api";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || "");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
  });

  // Fetch latest user data on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      if (response.data.success) {
        const userData = response.data.data.user;
        setProfilePicture(userData.profilePicture || "");
        setFormData({
          fullName: userData.fullName || "",
          email: userData.email || "",
        });
        // Update auth context with fresh data
        updateUser(userData);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const handleImageUpdate = (newImageUrl: string) => {
    setProfilePicture(newImageUrl);
    // Update user in auth context
    if (user) {
      updateUser({ ...user, profilePicture: newImageUrl });
    }
  };

  const handleImageRemove = () => {
    setProfilePicture("");
    // Update user in auth context
    if (user) {
      updateUser({ ...user, profilePicture: "" });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement profile update API call
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || "",
      email: user?.email || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Picture */}
        <div className="md:col-span-1">
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
              Profile Picture
            </h2>
            <div className="flex justify-center">
              <ProfilePictureUpload
                currentImage={profilePicture}
                onImageUpdate={handleImageUpdate}
                onImageRemove={handleImageRemove}
                size="lg"
                showUploadButton={false}
              />
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Click on your picture to upload or change it
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supported formats: JPEG, PNG, GIF, WebP (max 5MB)
              </p>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                ) : (
                  <p className="text-foreground">{user?.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                ) : (
                  <p className="text-foreground">{user?.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Role
                </label>
                <p className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary capitalize">
                  {user?.role?.toLowerCase()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Account Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  User ID
                </label>
                <p className="text-foreground font-mono text-sm">{user?.id}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Account Type
                </label>
                <p className="text-foreground capitalize">{user?.role?.toLowerCase()}</p>
              </div>

              {user?.staffDepartment && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Department
                  </label>
                  <p className="text-foreground">{user.staffDepartment.name}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Member Since
                </label>
                <p className="text-foreground">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-foreground hover:bg-muted rounded-lg transition-colors">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">View Activity</p>
                  <p className="text-sm text-muted-foreground">See your recent activity</p>
                </div>
              </button>
              
              <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-foreground hover:bg-muted rounded-lg transition-colors">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email Preferences</p>
                  <p className="text-sm text-muted-foreground">Manage notification settings</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
