import { useState } from "react";
import { StudentManagement } from "@/components/StudentManagement";
import { StudentDetailsModal } from "@/components/StudentDetails";

const Students = () => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedStudentId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Student Management</h1>
          <p className="text-muted-foreground">
            Manage registered students, view their analytics, and monitor their activity
          </p>
        </div>

        <StudentManagement />

        {selectedStudentId && (
          <StudentDetailsModal
            studentId={selectedStudentId}
            isOpen={showDetails}
            onClose={handleCloseDetails}
          />
        )}
      </div>
    </div>
  );
};

export default Students;
