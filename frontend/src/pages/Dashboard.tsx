import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, CreditCard, Users, MessageCircle, LogOut, Plus, Edit, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { usersAPI, chatAPI, getImageUrl } from "@/lib/api";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  balance: number;
  subscriptionType: string;
}

interface Girl {
  id: string;
  name: string;
  appearance: string;
  personality: string;
  avatarUrl?: string;
  firstMessage?: string;
  createdAt: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [girls, setGirls] = useState<Girl[]>([]);
  const [balance, setBalance] = useState<{ balance: number; transactions: Transaction[] }>({ balance: 0, transactions: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingGirl, setIsCreatingGirl] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Images for the slideshow during girl creation
  const slideshowImages = [
    '/uploads/images/1769683970567-eyw89.jpg',
    '/uploads/images/1769682079627-t35sx.jpg',
    '/uploads/images/1769683043479-iefl2.jpg',
    '/uploads/images/1769683648969-kxwcoy.jpg',
    '/uploads/images/1769686499071-on9vmn.jpg',
  ];
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [editedFirstName, setEditedFirstName] = useState('');
  const [editingGirl, setEditingGirl] = useState<Girl | null>(null);
  const [editedAppearance, setEditedAppearance] = useState('');
  const [editedPersonality, setEditedPersonality] = useState('');
  const [isUpdatingGirl, setIsUpdatingGirl] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Slideshow effect during girl creation
  useEffect(() => {
    if (isCreatingGirl && slideshowImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % slideshowImages.length);
      }, 800); // Change slide every 800ms

      return () => clearInterval(interval);
    } else {
      setCurrentSlideIndex(0); // Reset to first slide when not creating
    }
  }, [isCreatingGirl, slideshowImages.length]);

  const loadDashboardData = async () => {
    try {
      const [userData, balanceData, girlsData] = await Promise.all([
        usersAPI.getProfile(),
        usersAPI.getBalance(),
        usersAPI.getGirls()
      ]);

      setUser(userData);
      setBalance(balanceData);
      setGirls(girlsData);
      setEditedFirstName(userData.firstName || '');

      // Save user profile to localStorage for chat personalization
      localStorage.setItem('userProfile', JSON.stringify(userData));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // If not authenticated, redirect to login (handled by API interceptor)
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleCreateGirl = async () => {
    setIsCreatingGirl(true);
    try {
      // Create new girl via API
      const girlData = await chatAPI.createGirl();

      // Get the created girl from database to get real ID
      const girls = await usersAPI.getGirls();
      const newGirl = girls.find(g => g.name === girlData.name);

      if (newGirl) {
        // Clear old chat messages and save new girl to localStorage
        localStorage.removeItem('chatMessages');
        localStorage.setItem('currentGirl', JSON.stringify(newGirl));
        navigate(`/chat/${newGirl.id}`);
      } else {
        console.error('Could not find created girl in database');
        navigate('/chat');
      }
    } catch (error) {
      console.error('Error creating girl:', error);
      // Fallback to just navigating to chat
      navigate('/chat');
    } finally {
      setIsCreatingGirl(false);
    }
  };

  const handleDeleteGirl = async (girlId: string) => {
    try {
      await usersAPI.deleteGirl(girlId);
      setGirls(girls.filter(girl => girl.id !== girlId));
    } catch (error) {
      console.error('Error deleting girl:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    setIsUpdatingProfile(true);
    try {
      const updatedUser = await usersAPI.updateProfile({
        firstName: editedFirstName.trim() || undefined,
      });

      setUser(updatedUser);
      // Update localStorage
      localStorage.setItem('userProfile', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdateGirl = async () => {
    if (!editingGirl) return;

    setIsUpdatingGirl(true);
    try {
      let newAvatarUrl = editingGirl.avatarUrl;

      // Generate new avatar if appearance changed
      const appearanceChanged = editedAppearance.trim() !== editingGirl.appearance;
      if (appearanceChanged) {
        // Generate new image based on new appearance
        const { imageUrl } = await chatAPI.generateImage(
          `${editedAppearance.trim()}, beautiful girl, portrait, high quality`,
          undefined
        );
        if (imageUrl) {
          newAvatarUrl = imageUrl;
        }
      }

      // Update girl via API
      const updatedGirl = await usersAPI.updateGirl(editingGirl.id, {
        appearance: editedAppearance.trim(),
        personality: editedPersonality.trim(),
        ...(newAvatarUrl !== editingGirl.avatarUrl && { avatarUrl: newAvatarUrl }),
      });

      // Update the girl in the list
      setGirls(girls.map(girl =>
        girl.id === editingGirl.id ? updatedGirl : girl
      ));

      // If this girl is currently active in chat, update localStorage
      const currentGirl = JSON.parse(localStorage.getItem('currentGirl') || '{}');
      if (currentGirl.id === editingGirl.id) {
        localStorage.setItem('currentGirl', JSON.stringify(updatedGirl));
      }

      setEditingGirl(null);
    } catch (error) {
      console.error('Error updating girl:', error);
    } finally {
      setIsUpdatingGirl(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard | Virtual Companion</title>
        <meta name="description" content="Manage your virtual companions and account" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Heart className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-display font-medium">Dashboard</h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Main Content */}
          <Tabs defaultValue="girls" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="girls" className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                My Girls
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center">
                <Heart className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="girls" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Your Virtual Companions</h2>
                <Button onClick={handleCreateGirl} disabled={isCreatingGirl}>
                  {isCreatingGirl ? (
                    <div className="flex items-center space-x-2">
                      <div className="relative w-8 h-8 overflow-hidden rounded">
                        {slideshowImages.map((image, index) => (
                          <img
                            key={index}
                            src={getImageUrl(image)}
                            alt={`Slide ${index + 1}`}
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                              index === currentSlideIndex ? 'opacity-100' : 'opacity-0'
                            }`}
                          />
                        ))}
                      </div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Girl
                    </>
                  )}
                </Button>
              </div>

              {girls.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No companions yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first virtual companion to start chatting
                    </p>
                    <Button onClick={handleCreateGirl} disabled={isCreatingGirl}>
                      {isCreatingGirl ? (
                        <div className="flex items-center space-x-2">
                          <div className="relative w-8 h-8 overflow-hidden rounded">
                            {slideshowImages.map((image, index) => (
                              <img
                                key={index}
                                src={getImageUrl(image)}
                                alt={`Slide ${index + 1}`}
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                                  index === currentSlideIndex ? 'opacity-100' : 'opacity-0'
                                }`}
                              />
                            ))}
                          </div>
                          <span>Creating...</span>
                        </div>
                      ) : (
                        'Create Your First Girl'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.isArray(girls) && girls.map((girl) => (
                    <Card key={girl.id} className="relative">
                      {/* Delete button in top-right corner */}
                      <button
                        onClick={() => handleDeleteGirl(girl.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive hover:text-destructive transition-colors z-10"
                        title="Delete companion"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <CardHeader>
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={girl.avatarUrl ? getImageUrl(girl.avatarUrl) : undefined} />
                            <AvatarFallback>{girl.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{girl.name}</CardTitle>
                            <CardDescription className="text-sm">
                              Created {new Date(girl.createdAt).toLocaleDateString()}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {girl.personality}
                        </p>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              // Clear old chat messages when switching to a new girl
                              localStorage.removeItem('chatMessages');
                              localStorage.setItem('currentGirl', JSON.stringify(girl));
                              navigate(`/chat/${girl.id}`);
                            }}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Chat
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingGirl(girl);
                              setEditedAppearance(girl.appearance);
                              setEditedPersonality(girl.personality);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6">
              <h2 className="text-xl font-semibold">Transaction History</h2>

              {!balance?.transactions || balance.transactions.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
                    <p className="text-muted-foreground">
                      Your transaction history will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {Array.isArray(balance.transactions) && balance.transactions.map((transaction) => (
                        <div key={transaction.id} className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className={`font-medium ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount} credits
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <h2 className="text-xl font-semibold">Profile Information</h2>

              <Card>
                <CardHeader>
                  <CardTitle>Account Details</CardTitle>
                  <CardDescription>Your profile information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">First Name</label>
                    <div className="flex gap-2">
                      <Input
                        value={editedFirstName}
                        onChange={(e) => setEditedFirstName(e.target.value)}
                        placeholder="Enter your first name"
                      />
                      <Button
                        onClick={handleUpdateProfile}
                        disabled={isUpdatingProfile || editedFirstName.trim() === (user?.firstName || '')}
                        size="sm"
                      >
                        {isUpdatingProfile ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subscription</label>
                    <p className="text-sm text-muted-foreground capitalize">
                      {user?.subscriptionType} plan
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Balance Card */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Balance
                </CardTitle>
                <CardDescription>Your current credits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary mb-4">
                  {balance?.balance || 0} credits
                </div>
                <Button variant="outline" size="sm">
                  Top up balance
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Info */}
          <div className="mt-8">
            <Card>
              <CardContent className="text-center py-6">
                <Badge variant="secondary" className="mb-2">
                  {user?.subscriptionType} plan
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Your current subscription plan
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Girl Dialog */}
        <Dialog open={!!editingGirl} onOpenChange={() => setEditingGirl(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit {editingGirl?.name}</DialogTitle>
              <DialogDescription>
                Modify the appearance and personality of your virtual companion.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Appearance</label>
                <Textarea
                  value={editedAppearance}
                  onChange={(e) => setEditedAppearance(e.target.value)}
                  placeholder="Describe the girl's appearance..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Personality</label>
                <Textarea
                  value={editedPersonality}
                  onChange={(e) => setEditedPersonality(e.target.value)}
                  placeholder="Describe the girl's personality..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingGirl(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateGirl}
                disabled={isUpdatingGirl}
              >
                {isUpdatingGirl ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Dashboard;