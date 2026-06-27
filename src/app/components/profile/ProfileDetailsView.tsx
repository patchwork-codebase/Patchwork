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
                  <div className="flex flex-col gap-4">
                    {/* Header Row: Name & Verifications */}
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-[28px] sm:text-[32px] font-extrabold text-slate-900 font-display tracking-tight leading-tight m-0">
                        {profile.name}
                      </h1>
                      <div className="flex items-center gap-2 mt-1 sm:mt-0">
                        {!profile.organizationName && (
                          <VerifiedTick isVerified={!!profile.isVerifiedExpert} className="w-5 h-5 shrink-0" />
                        )}
                        {profile.organizationName && (
                          <OrganizationBadge 
                            orgName={profile.organizationName} 
                            orgLogo={profile.organizationLogoUrl} 
                            isVerified={!!profile.isVerifiedExpert} 
                          />
                        )}
                        {profile.isVerifiedExpert && (
                          <ExpertBadge tier={profile.expertLevel || "bronze"} size="sm" />
                        )}
                      </div>
                    </div>

                    {/* Stats Row: Role, Rep, Date, Followers */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Role */}
                      <span className="flex items-center gap-1.5 text-[12px] font-bold text-primary-700 bg-primary-50/50 border border-primary-200/50 px-3 py-1.5 rounded-full capitalize tracking-wide shadow-sm">
                        {profile.role === 'builder' ? <Hammer className="w-3.5 h-3.5 text-primary-500" /> : <Eye className="w-3.5 h-3.5 text-primary-500" />}
                        {profile.role} {profile.domain && profile.role === 'builder' ? ` • ${profile.domain.replace('-', ' ')}` : ''}
                      </span>
                      
                      {/* Reputation */}
                      <span className="flex items-center gap-1.5 text-[12px] font-bold text-amber-700 bg-amber-50/50 border border-amber-200/50 px-3 py-1.5 rounded-full tracking-wide shadow-sm">
                        <Zap className="w-3.5 h-3.5 text-amber-500" /> {profile.reputation} rep
                      </span>
                      
                      {/* Join Date */}
                      <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-600 bg-slate-50/80 border border-slate-200/60 px-3 py-1.5 rounded-full tracking-wide shadow-sm">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Joined {timeAgo(profile.createdAt || '')}
                      </span>
                      
                      <div className="w-px h-5 bg-slate-200 hidden sm:block mx-1"></div>
                      
                      {/* Followers */}
                      <div className="flex items-center gap-4 bg-slate-50/50 border border-slate-100 px-3 py-1.5 rounded-full shadow-sm">
                        <div className="flex items-center gap-2 text-[12px] font-bold text-slate-900 tracking-wide">
                          {profile.followers && profile.followers.length > 0 ? (
                            <div className="flex items-center group/followers cursor-pointer mr-1">
                              {profile.followers.slice(0, 3).map((followerId: string, i: number) => (
                                <div
                                  key={followerId}
                                  className="w-5 h-5 rounded-full bg-slate-200 border border-white overflow-hidden transition-all duration-300 -ml-1.5 first:ml-0 group-hover/followers:-ml-0.5 group-hover/followers:shadow-sm shrink-0"
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
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span>
                            {profile.followerCount || 0} <span className="text-slate-500 font-medium">followers</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-900 tracking-wide">
                          {profile.followingCount || 0} <span className="text-slate-500 font-medium">following</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {profile.bio && <p className="text-[14px] text-slate-700 mt-4 leading-relaxed max-w-xl mx-auto sm:mx-0 font-medium">{profile.bio}</p>}
                  
                  {/* Social Links & Skills */}
                  {(profile.website || profile.twitter || profile.githubUrl || profile.linkedinUrl || (profile.skills && profile.skills.length > 0)) && (
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
                        {profile.githubUrl && (
                          <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full transition-colors">
                            <Github className="w-3.5 h-3.5" /> GitHub
                          </a>
                        )}
                        {profile.linkedinUrl && (
                          <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] font-bold text-slate-600 hover:text-[#0A66C2] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full transition-colors">
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
