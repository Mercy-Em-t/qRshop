import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase-client";
import EcosystemNav from "../../components/EcosystemNav";

export default function CommunityFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Post Engine State
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Debounced Product Search
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, name, price, product_images(url), shops(name)')
        .ilike('name', `%${searchQuery}%`)
        .limit(5);
      if (!error && data) setSearchResults(data);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    async function fetchPosts() {
      // Connect to the new tables + native join on the commerce table
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          community_profiles (username, full_name, avatar_url),
          communities (name, slug),
          menu_items (
             id, 
             name, 
             price, 
             product_images(url), 
             shop_id,
             shops (name, subdomain)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
         console.warn("Could not fetch posts (Schema might not be pushed yet):", error);
      } else if (data) {
         setPosts(data);
      }
      setLoading(false);
    }
    fetchPosts();
  }, []);

  const [memberOf, setMemberOf] = useState(new Set());

  const fetchMembership = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('community_members').select('community_id').eq('user_id', user.id);
      if (data) setMemberOf(new Set(data.map(m => m.community_id)));
    }
  };

  useEffect(() => {
    fetchMembership();
  }, []);

  const handleJoinCommunity = async (communityId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Please log in to join communities.");
      return;
    }
    
    // Explicitly handle membership update
    const { error } = await supabase.from('community_members').upsert({
      user_id: user.id,
      community_id: communityId
    });
    
    if (error) {
      alert("Failed to update community membership: " + error.message);
    } else {
      setMemberOf(prev => new Set([...prev, communityId]));
    }
  };

  const handlePostSubmit = async () => {
    if (!postContent.trim()) return;
    setIsPosting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please log in or create an account to post in the community.");
        setIsPosting(false);
        return;
      }
      
      // Upsert profile silently
      const { error: profileErr } = await supabase.from('community_profiles').upsert({
        id: user.id,
        username: user.email.split('@')[0] + Math.floor(Math.random() * 1000),
        full_name: user.user_metadata?.full_name || "Community Member"
      }, { onConflict: 'id', ignoreDuplicates: true });
      
      if (profileErr && profileErr.code !== '23505') console.warn(profileErr);

      // Insert Post
      const { data: newPost, error: postErr } = await supabase.from('community_posts').insert({
        author_id: user.id,
        content: postContent,
        tagged_product_id: selectedProduct?.id || null
      }).select(`
         *,
         community_profiles (username, full_name, avatar_url),
         communities (name, slug),
         menu_items (
            id, name, price, product_images(url), shop_id, shops (name, subdomain)
         )
      `).single();

      if (postErr) throw postErr;
      
      setPosts([newPost, ...posts]);
      setPostContent("");
      setSelectedProduct(null);
    } catch (err) {
      alert("Failed to post: " + err.message);
    } finally {
      setIsPosting(false);
    }
  };

  // Format date helper
  const timeAgo = (dateStr) => {
    const dates = new Date(dateStr);
    const now = new Date();
    const diffMs = now - dates;
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    const diffHrs = Math.round(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h`;
    return `${Math.round(diffHrs / 24)}d`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
       {/* Left Sidebar Layout */}
       <div className="hidden md:block w-64 p-6 sticky top-0 h-screen border-r border-gray-200 bg-white">
          <Link to="/" className="text-2xl font-black text-indigo-700 tracking-tight block mb-8">
             Savannah<span className="text-gray-900">Social</span>
          </Link>
          <nav className="space-y-4 font-bold text-gray-700">
             <Link to="/community" className="flex items-center gap-3 text-indigo-700 bg-indigo-50 px-4 py-3 rounded-xl">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                 Global Feed
             </Link>
             <button onClick={() => alert("Stubbed profile navigation")} className="w-full flex items-center gap-3 hover:bg-gray-100 px-4 py-3 rounded-xl transition">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                 My Profile
             </button>
          </nav>
       </div>

        {/* Main Feed */}
        <div className="w-full max-w-2xl bg-white min-h-screen border-r border-gray-200">
           <header className="p-4 border-b border-gray-100 bg-white flex items-center justify-between">
              <h1 className="text-xl font-bold">Global Social Feed</h1>
              <Link to="/" className="md:hidden text-indigo-600 font-bold text-sm">Savannah</Link>
           </header>
           
           <EcosystemNav />

           {/* Create Post Interface */}
          <div className="p-4 border-b-8 border-gray-50 flex gap-4 relative">
             <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0 border-2 border-indigo-100 flex items-center justify-center text-xl">👤</div>
             <div className="flex-1">
                <textarea 
                   placeholder="What's cooking in your community?" 
                   rows="2"
                   value={postContent}
                   onChange={e => setPostContent(e.target.value)}
                   className="w-full bg-transparent text-xl outline-none resize-none pt-2 text-gray-800 placeholder-gray-400"
                ></textarea>
                
                {/* Active Tagged Product Preview */}
                {selectedProduct && (
                   <div className="mt-2 mb-2 p-2 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <span className="text-xl">🛒</span>
                         <div>
                            <p className="text-sm font-bold text-green-900 leading-tight">{selectedProduct.name}</p>
                            <p className="text-xs text-green-700">KSh {selectedProduct.price} · {selectedProduct.shops?.name}</p>
                         </div>
                      </div>
                      <button onClick={() => setSelectedProduct(null)} className="p-1 hover:bg-green-100 rounded-full text-green-800">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                   </div>
                )}

                <div className="flex justify-between items-center mt-2 pt-3 border-t border-gray-100 relative">
                   <button onClick={() => setShowTagModal(!showTagModal)} className="text-indigo-600 font-bold text-sm bg-indigo-50 px-3 py-1.5 rounded-full flex items-center gap-2 hover:bg-indigo-100 transition">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                       Tag Product
                   </button>
                   <button 
                      onClick={handlePostSubmit}
                      disabled={isPosting || !postContent.trim()}
                      className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition"
                   >
                      {isPosting ? "Posting..." : "Post"}
                   </button>

                   {/* Inline Product Search Modal */}
                   {showTagModal && (
                      <div className="absolute top-12 left-0 w-80 bg-white shadow-2xl rounded-2xl border border-gray-200 overflow-hidden z-20">
                         <div className="p-3 border-b border-gray-100 bg-gray-50">
                            <input 
                               type="text"
                               autoFocus
                               placeholder="Search global products..."
                               value={searchQuery}
                               onChange={e => setSearchQuery(e.target.value)}
                               className="w-full bg-white px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                         </div>
                         <div className="max-h-64 overflow-y-auto">
                            {isSearching ? (
                               <div className="p-4 text-center text-xs text-gray-500 font-medium">Scanning network...</div>
                            ) : searchResults.length > 0 ? (
                               searchResults.map(prod => (
                                  <div 
                                     key={prod.id} 
                                     onClick={() => { setSelectedProduct(prod); setShowTagModal(false); setSearchQuery(""); }}
                                     className="p-3 border-b border-gray-50 flex items-center gap-3 hover:bg-blue-50 cursor-pointer transition"
                                  >
                                     <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                                        {prod.product_images?.length > 0 ? <img src={prod.product_images[0].url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">☕</div>}
                                     </div>
                                     <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-bold text-gray-900 truncate">{prod.name}</p>
                                        <p className="text-xs text-indigo-600 font-bold">KSh {prod.price} <span className="text-gray-400 font-normal">· {prod.shops?.name}</span></p>
                                     </div>
                                  </div>
                               ))
                            ) : searchQuery ? (
                               <div className="p-4 text-center text-xs text-gray-500">No products found matching "{searchQuery}"</div>
                            ) : (
                               <div className="p-4 text-center text-xs text-gray-400">Type above to search merchant catalogs</div>
                            )}
                         </div>
                      </div>
                   )}
                </div>
             </div>
          </div>

          {/* Social Posts Stream */}
          <div className="divide-y divide-gray-100">
             {loading && <div className="p-8 text-center text-gray-500 font-medium">Syncing feed...</div>}
             {!loading && posts.length === 0 && (
                <div className="p-10 text-center text-gray-400">
                   <p className="text-5xl mb-4">🌱</p>
                   <p className="font-bold text-gray-600">The community is quiet.</p>
                   <p className="text-sm">Be the first to drop some alpha or review a product!</p>
                </div>
             )}

             {posts.map(post => (
                <article key={post.id} className="p-4 hover:bg-gray-50 transition cursor-pointer">
                   <div className="flex gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                         {post.community_profiles?.avatar_url ? (
                            <img src={post.community_profiles.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                         ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                               {post.community_profiles?.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                         )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                         <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{post.community_profiles?.full_name || 'Anonymous'}</span>
                            <span className="text-gray-500 text-sm">@{post.community_profiles?.username || 'unknown'}</span>
                            <span className="text-gray-400 text-sm">· {timeAgo(post.created_at)}</span>
                         </div>
                         
                         {/* Optional Community Badge */}
                         {post.communities && (
                            <div className="mt-0.5 mb-2">
                               <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                 {post.communities.name}
                               </span>
                            </div>
                         )}

                         <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>

                         {/* Optional Social Post Image */}
                         {post.image_url && (
                            <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200">
                               <img src={post.image_url} className="w-full h-auto" alt="post attachment" />
                            </div>
                         )}

                         {/* THE MAGIC INTERCEPT: Render Commerce Product Inside Social Feed */}
                         {post.menu_items && (
                            <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-3 flex gap-4 hover:border-green-300 transition group shadow-sm">
                               <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                                  {post.menu_items.product_images && post.menu_items.product_images.length > 0 ? (
                                     <img src={post.menu_items.product_images[0].url} className="w-full h-full object-cover group-hover:scale-105 transition" alt="product" />
                                  ) : (
                                     <div className="w-full h-full flex items-center justify-center text-xl">🛒</div>
                                  )}
                               </div>
                               <div className="flex-1 flex flex-col justify-center">
                                  <p className="text-xs text-gray-500 font-bold mb-0.5 uppercase tracking-wide">
                                    Sold by {post.menu_items.shops?.name || "Local Merchant"}
                                  </p>
                                  <h3 className="font-bold text-gray-900 line-clamp-1">{post.menu_items.name}</h3>
                                  <div className="flex items-center justify-between mt-1">
                                     <span className="font-black text-green-600">KSh {post.menu_items.price}</span>
                                     <a 
                                        href={post.menu_items.shops?.subdomain ? `https://${post.menu_items.shops.subdomain}.tmsavannah.com/buy/${post.menu_items.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : `/buy/${post.menu_items.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                                        target="_blank" rel="noreferrer"
                                        className="bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-sm font-bold border border-green-200 hover:bg-green-600 hover:text-white transition"
                                        onClick={(e) => e.stopPropagation()}
                                     >
                                        Buy Now
                                     </a>
                                  </div>
                               </div>
                            </div>
                         )}

                         {/* Post Action Buttons */}
                         <div className="flex gap-10 mt-4 text-gray-400 font-medium text-sm">
                            <button className="flex items-center gap-2 hover:text-blue-500 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg> 0</button>
                            <button className="flex items-center gap-2 hover:text-green-500 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> 0</button>
                            <button className="flex items-center gap-2 hover:text-red-500 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg> 0</button>
                         </div>
                      </div>
                   </div>
                </article>
             ))}
          </div>
       </div>

       <div className="hidden lg:block w-80 p-6 sticky top-0 h-screen">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
             <h3 className="font-bold text-gray-900 mb-4">Trending Communities</h3>
             <div className="space-y-4">
                {[
                  { id: 'nairobi-foodies', name: 'Nairobi Foodies', icon: '☕', members: '1.2k' },
                  { id: 'savannah-crafters', name: 'Savannah Crafters', icon: '🎨', members: '845' },
                  { id: 'tech-hobbies', name: 'Tech & Hobbies', icon: '💻', members: '2.1k' }
                ].map(comm => (
                  <div key={comm.id} className="flex gap-3 items-center justify-between">
                    <div className="flex gap-3 items-center">
                       <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex justify-center items-center font-bold text-xl">{comm.icon}</div>
                       <div>
                         <p className="font-bold text-sm text-gray-800">{comm.name}</p>
                         <p className="text-xs text-gray-500">{comm.members} Members</p>
                       </div>
                    </div>
                    <button 
                       onClick={() => handleJoinCommunity(comm.id)}
                       className={`text-[10px] font-black px-3 py-1.5 rounded-full transition ${memberOf.has(comm.id) ? 'bg-green-50 text-green-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                       {memberOf.has(comm.id) ? 'Joined' : 'Join'}
                    </button>
                  </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
}
