import React from "react";
import { Hammer, Eye, Zap, Calendar, Users, Globe, Twitter, Github, Linkedin } from "lucide-react";
import { VerifiedTick } from "../ui/VerifiedTick";
import { OrganizationBadge } from "../ui/OrganizationBadge";
import { ExpertBadge } from "./ExpertBadge";
import { getAvatarUrl, timeAgo } from "../../utils/helpers";

interface ProfileDetailsViewProps {
  profile: any;
}

export function ProfileDetailsView({ profile }: ProfileDetailsViewProps) {
  return (
    <>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-2">
                    <h1 className="text-[28px] sm:text-[32px] font-extrabold text-slate-900 font-display tracking-tight leading-tight sm:leading-none break-words flex flex-wrap items-center gap-2">
                      {profile.name}
                      {!(profile as any).organization_name && (
                        <VerifiedTick isVerified={!!(profile as any).isVerifiedExpert} className="w-6 h-6 shrink-0" />
                      )}
                      <div className="mt-2 sm:mt-0">
                        <OrganizationBadge 
                          orgName={(profile as any).organization_name} 
                          orgLogo={(profile as any).organization_logo_url} 
                          isVerified={!!(profile as any).isVerifiedExpert} 
                        />
                      </div>
                    </h1>
                    {(profile as any).isVerifiedExpert && (
                      <ExpertBadge tier={(profile as any).expertLevel || "bronze"} size="md" />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-primary-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full capitalize tracking-wide">
                      {profile.role === 'builder' ? <Hammer className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {profile.role} {(profile as any).domain && profile.role === 'builder' ? ` • ${(profile as any).domain.replace('-', ' ')}` : ''}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-500 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full tracking-wide">
                      <Zap className="w-3 h-3" /> {profile.reputation} rep
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full tracking-wide">
                      <Calendar className="w-3 h-3" /> Joined {timeAgo(profile.createdAt || '')}
                    </span>
                    <div className="w-px h-4 bg-slate-300 hidden sm:block mx-1"></div>
                    <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-900 tracking-wide">
                      {profile.followers && profile.followers.length > 0 ? (
                        <div className="flex items-center group/followers cursor-pointer">
                          {profile.followers.slice(0, 4).map((followerId, i) => (
                            <div
                              key={followerId}
                              className="w-5 h-5 rounded-full bg-slate-200 border-2 border-white overflow-hidden transition-all duration-300 -ml-1.5 first:ml-0 group-hover/followers:-ml-0.5 group-hover/followers:shadow-sm shrink-0"
                              style={{ zIndex: 10 - i }}
                            >
                              <img
                                src={getAvatarUrl(followerId)}
                                alt="Follower"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span className="ml-0.5">
                        {profile.followerCount || 0} <span className="text-slate-600 font-medium">followers</span>
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-900 tracking-wide">
                      {profile.followingCount || 0} <span className="text-slate-600 font-medium">following</span>
                    </span>
                  </div>
                  {profile.bio && <p className="text-[14px] text-slate-700 mt-4 leading-relaxed max-w-xl mx-auto sm:mx-0 font-medium">{profile.bio}</p>}
                  
                  {/* Social Links & Skills */}
                  {(profile.website || profile.twitter || profile.github_url || profile.linkedin_url || (profile.skills && profile.skills.length > 0)) && (
                    <div className="mt-5 space-y-4 max-w-xl mx-auto sm:mx-0">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                        {profile.website && (
                          <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full transition-colors">
                            <Globe className="w-3.5 h-3.5" /> Website
                          </a>
                        )}
                        {profile.twitter && (
                          <a href={`https://twitter.com/${profile.twitter.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] font-bold text-slate-600 hover:text-[#1DA1F2] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full transition-colors">
                            <Twitter className="w-3.5 h-3.5" /> Twitter
                          </a>
                        )}
                        {profile.github_url && (
                          <a href={profile.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full transition-colors">
                            <Github className="w-3.5 h-3.5" /> GitHub
                          </a>
                        )}
                        {profile.linkedin_url && (
                          <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] font-bold text-slate-600 hover:text-[#0A66C2] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full transition-colors">
                            <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                          </a>
                        )}
                      </div>
                      
                      {profile.skills && profile.skills.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          {profile.skills.map(skill => (
                            <span key={skill} className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
    </>
  );
}
