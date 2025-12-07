'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    department: '',
    position: '',
    baseSalary: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.department || !formData.position) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department,
        position: formData.position,
        baseSalary: formData.baseSalary ? parseFloat(formData.baseSalary) : undefined,
      };

      await register(userData);
      
      toast({
        title: 'Success',
        description: 'Account created successfully! Please login.',
      });

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Create Account
          </CardTitle>
          <CardDescription className="text-center">
            {step === 1
              ? 'Enter your basic information to get started'
              : 'Complete your profile information'}
          </CardDescription>
          <div className="flex justify-center gap-2 pt-4">
            <div
              className={`h-2 w-16 rounded-full ${
                step === 1 ? 'bg-primary' : 'bg-primary/30'
              }`}
            />
            <div
              className={`h-2 w-16 rounded-full ${
                step === 2 ? 'bg-primary' : 'bg-primary/30'
              }`}
            />
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@company.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleChange('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="hr_staff">HR Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select your role in the organization
                </p>
              </div>

              <Button onClick={handleNext} className="w-full">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <div className="text-center text-sm">
                Already have an account?{' '}
                <button
                  onClick={() => router.push('/')}
                  className="text-primary hover:underline font-medium"
                >
                  Login here
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  type="text"
                  placeholder="e.g., Sales, IT, HR, Marketing"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  type="text"
                  placeholder="e.g., Developer, Manager, Analyst"
                  value={formData.position}
                  onChange={(e) => handleChange('position', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseSalary">Base Salary (Optional)</Label>
                <Input
                  id="baseSalary"
                  type="number"
                  placeholder="5000"
                  value={formData.baseSalary}
                  onChange={(e) => handleChange('baseSalary', e.target.value)}
                  min="0"
                  step="100"
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank if not applicable
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Account Summary</p>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Name:</span>{' '}
                    <span className="font-medium">{formData.name}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Email:</span>{' '}
                    <span className="font-medium">{formData.email}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Role:</span>{' '}
                    <span className="font-medium capitalize">
                      {formData.role.replace('_', ' ')}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </div>

              <div className="text-center text-sm">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="text-primary hover:underline font-medium"
                >
                  Login here
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
